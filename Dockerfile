FROM ruby:2.7.4

RUN apt-get update -qq && apt-get install -y build-essential default-mysql-client netcat-traditional

ENV APP_HOME /app
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

ADD Gemfile* $APP_HOME/
RUN gem install bundler -v 2.1.4 && bundle install

ADD . $APP_HOME

EXPOSE 4567

CMD ["sh", "-c", "until nc -z -v -w30 db 3306; do echo 'Waiting for database...'; sleep 1; done && bundle exec rackup --host 0.0.0.0 -p 4567"]
