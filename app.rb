require 'bundler/setup'
Bundler.require(:default)
require "sinatra/reloader" if development?
require 'json'
require 'open-uri'
require 'tilt/erb'

#
# Config

configure do
  enable :sessions
  set :sessions, :expire_after => 2592000

  set :database, ENV['DATABASE_URL'] || 'mysql2://root@localhost/PICKTUNE'

  # https://affiliate.itunes.apple.com/resources/documentation/genre-mapping/
  set :genres, {
    2  => "Blues",
    11 => "Jazz",
    21 => "Rock",
    20 => "Alternative",
    6  => "Country",
    7  => "Electronic",
    14 => "Pop",
    15 => "Soul",
    18 => "Hip Hop",
    16 => "Soundtrack",
    4  => "Kid Bop"
  }

end

#
# Database

migration "create tables" do
  database.create_table :games do
    primary_key :id
    String      :username, :null => false
    integer     :genre, :null => false
    integer     :score, :default => 0
    timestamp   :created_at, :null => false
  end
end

class Game < Sequel::Model
end

#
# Routes

get '/' do
  erb :home
end

post '/' do
  name = Rack::Utils.escape_html(params[:user]).strip
  redirect to('/') if name.empty? || !params[:genre]

  session.clear
  session[:user] = name
  session[:genre] = params[:genre]
  redirect to('/play')
end

get '/play/?' do
  redirect to('/') unless session[:user] && session[:genre]

  erb :play
end

get '/songs.json/?' do
  halt unless request.xhr?

  response_body = URI.open("https://itunes.apple.com/us/rss/topsongs/limit=200/genre=#{session[:genre]}/json")
  json_data = JSON.load(response_body)
  songs = []
  json_data['feed']['entry'].each do |entry|
    songs << {
      :id => entry['id']['attributes']['im:id'],
      :artist => entry['im:artist']['label'],
      :name => entry['im:name']['label'],
      :image => entry['im:image'].first['label'],
      :audio => entry['link'].last['attributes']['href']
    }
  end
  json songs.sample(40)
end

post '/endgame/?' do
  game = Game.create(:username => session[:user], 
              :genre => session[:genre], 
              :score => params[:score], 
              :created_at=>Time.now)
  json :last_game_id => game.id
end

get '/scores.json/?' do
  halt unless request.xhr?

  games = Game.order(Sequel.desc(:score))

  if params[:filter]=='all_time'
  elsif params[:filter]=='latest'
    games = games.filter{created_at > Date.today - 180} # last 180 days
  end

  games = games.to_hash_groups(:genre)
  scores = {}
  games.each do |_genre,games|
    genre = settings.genres[_genre]
    scores[genre] = []
    i = 0
    games.each do |_game|
      unless scores[genre].find { |s| s['username'] == _game.username }
        i = i + 1
        scores[genre] << {
          'username' => _game.username.to_s.encode('UTF-8', invalid: :replace, undef: :replace, replace: '?'),
          'score' => _game.score,
          'created_at' => _game.created_at.strftime("%m/%d/%Y"),
          'id' => _game.id,
          'index' => i
        } if i <= 10
      end
    end
  end

  json scores
end

get '/scoreboard/?' do
  @last_game = Game.find(id: params[:last_game_id]) if params[:last_game_id]

  erb :scoreboard
end

