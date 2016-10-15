require 'bundler/setup'
Bundler.require(:default)
require "sinatra/reloader" if development?
require 'json'
require 'open-uri'

#
# Config

configure do
  enable :sessions
  set :database, ENV['DATABASE_URL'] || 'mysql://root@localhost/PICKTUNE'

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
    16 => "Soundtrack"
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
  redirect to('/') unless !params[:user].empty? && params[:genre]

  session.clear
  session[:user] = Rack::Utils.escape_html(params[:user])
  session[:genre] = params[:genre]
  redirect to('/play')
end

get '/play/?' do
  redirect to('/') unless session[:user] && session[:genre]

  url = "https://itunes.apple.com/us/rss/topsongs/limit=200/genre=#{session[:genre]}/xml"

  doc = Nokogiri::HTML(open(url))
  songs = []
  doc.xpath('//feed/entry').each do |entry|
    songs << {
      :id => entry.at_xpath(".//id")['im:id'],
      :artist => entry.at_xpath(".//artist").text,
      :name => entry.at_xpath(".//name").text,
      :image => entry.at_xpath(".//image[@height='55']").text,
      :audio => entry.at_xpath(".//link[@rel='enclosure']")['href']
    }
  end
  @songs = songs.sample(40).shuffle

  erb :play
end

post '/endgame/?' do
  game = Game.create(:username => session[:user], 
              :genre => session[:genre], 
              :score => params[:score], 
              :created_at=>Time.now)
  json :last_game_id => game.id
end

get '/scoreboard/?' do
  @last_game = Game.find(id: params[:last_game_id]) if params[:last_game_id]

  games = Game.order(Sequel.desc(:score)).to_hash_groups(:genre)
  scores = {}
  games.each do |genre,games|
    scores[genre] = []
    games.each_with_index do |game,index|
      unless scores[genre].find { |s| s.username == game.username }
        if index <= 10
          scores[genre] << game
          @highscore = true if @last_game && game == @last_game
        end
      end
    end
  end

  @grouped_games = scores
  erb :scoreboard
end

