
//
//
//
var Colors = (function() {
  var available_colors = ["red", "pink", "purple", "deep-purple", "indigo", "blue", "light-blue", "cyan", "teal", "green", "light-green", "lime", "yellow", "amber", "orange", "deep-orange", "brown", "grey", "blue-grey"];

  var getRandom = function() {
    return available_colors[Math.floor(Math.random() * available_colors.length)];
  }
  
  return {
    getRandom: getRandom
  }
})();

//
//
//
var Game = (function() {
    var songs;
    var counter;
    var score = 0;
    var round = 0;

    var setSongs = function(songs) {
        FB.AppEvents.logEvent("startNewGame");
        this.songs = songs;
        console.log('Initializing with ' + songs.length + ' songs...');
    }

    var startRound = function() {
        round++;
        counter = 20;
        counterPaused = true;

        if (round > 10) {
            console.log("Game Over!");
            FB.AppEvents.logEvent("endedGame");
            $.post("/endgame", { score: score }).done(function(data) {
                window.location.replace("/scoreboard?last_game_id=" + data.last_game_id);
            });
            $('#content').html($('#pleaseWaitTemplate').tmpl());
            return;
        }

        $('#counter').removeClass('nearzero');
        $('#counter').html(counter);

        roundSongs = Game.songs.splice(0,4);
        selectedSong = roundSongs[Math.floor(Math.random() * roundSongs.length)];
        //console.log(selectedSong);

        console.log("Score: " + score + " Round: " + round);
        $('#round').html(round);

        var audio = new Audio(selectedSong['audio']);
        audio.play();

        audio.onloadeddata = function() {
          counterPaused = false;
        };

        $("#songsList").html($("#songsTemplate").tmpl(roundSongs));
        Materialize.showStaggeredList('#songsList');

        $('li.song').click(function() {
            if ($(this).data('id') == selectedSong['id']) {
                // correct answer
                selectSong(true);
            } else {
                // wrong answer
                selectSong(false);
            }

            if(isMobile.any()) {
                startRound();
            } else {
                setTimeout(function(){ startRound(); }, 2000);
            }
        });

        var selectSong = function(correct) {
          audio.pause();
          audio.currentTime = 0;
          clearInterval(countdown);

          if (correct) {
            // right answer
            score = score + counter;
            Materialize.toast('+ ' + counter + ' points!', 3000);
            $('#score').html(score);
            console.log("We have a winner!");
            new Audio("/sounds/right.mp3").play();
            FB.AppEvents.logEvent("selectedRightAnswer");
            if (!isMobile.any()) {
              $("#songsList").html($("#rightAnswerTemplate").tmpl());
            }
          } else {
            // wrong answer
            console.log("Wrong answer!");
            new Audio("/sounds/wrong.mp3").play();
            FB.AppEvents.logEvent("selectedWrongAnswer");
            if (!isMobile.any()) {
              $("#songsList").html($("#wrongAnswerTemplate").tmpl());
            }
          }
        };

        var countdown = setInterval(function() {
            if (!counterPaused) {
                counter--;
            }
            $('#counter').html(counter);
            if (counter <= 10) {
                $('.song .artist').fadeIn();
            }
            if (counter <= 5) {
                $('#counter').addClass('nearzero');
            }
            if (counter == 0) {
                console.log("Times up!");

                selectedWrongSong();
                               
                FB.AppEvents.logEvent("roundTimedOut");

                if(isMobile.any()) {
                    startRound();
                } else {
                    setTimeout(function(){ startRound(); }, 2000);
                }
            }
        }, 1000);

    };

    return {
        setSongs: setSongs,
        startRound: startRound
    };
 
})();

//
//
//
function shareScoreToFacebook(message) {
    FB.ui({
      method: 'feed',
      link: 'http://picktun.es',
      name: message,
      description: 'Play Name That Tune with strangers in a highly competitive music guessing game.',
      caption: 'picktun.es',
      display: 'popup'
      }, function(response){});
}

