require 'bundler/setup'
Bundler.require(:default)
require "sinatra/reloader" if development?
require 'sinatra'
require 'sinatra/sequel'
require 'json'
require 'open-uri'

configure do
  enable :sessions
  set :database, 'mysql://root@localhost/PICKTUNE'
  set :genres, {
    2  => "Blues",
    11 => "Jazz",
    21 => "Rock",
    20 => "Alternative",
    6  => "Country",
    7  => "Electronic",
    14 => "Pop",
    15 => "Soul",
  }
end

configure :production do
  set :database, 'mysql://root@localhost/PICKTUNE'
end

puts "the games table doesn't exist" if !database.table_exists?('games')
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
  many_to_one :bar
end


get '/' do
  erb :home
end

post '/' do
  redirect to('/') unless params[:user] && params[:genre]

  session.clear
  session[:user] = params[:user]
  session[:genre] = params[:genre]
  redirect to('/play')
end

get '/play/?' do
  redirect to('/') unless session[:user] && session[:genre]

  url = "https://itunes.apple.com/us/rss/topsongs/limit=100/genre=#{session[:genre]}/xml"

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
  @songs = songs

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
  @grouped_games = Game.order(Sequel.desc(:score)).to_hash_groups(:genre)
  @last_game = Game.find(params[:last_game_id])
  erb :scoreboard
end

