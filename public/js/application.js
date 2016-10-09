var Game = (function() {
    var songs;
    var counter;
    var score = 0;
    var round = 0;

    var setSongs = function(songs) {
        console.log('Initializing songs...');
        FB.AppEvents.logEvent("startNewGame");
        this.songs = songs;
    }

    var startRound = function() {
        round++;
        counter = 20;

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

        $("#songsList").hide().html($("#songsTemplate").tmpl(roundSongs)).fadeIn('slow');

        $('.song a').click(function() {
            if ($(this).data('id') == selectedSong['id']) {
                /* correct answer */
                selectedRightSong();
            } else {
                /* wrong answer */
                selectedWrongSong();
            }

            if(isMobile.any()) {
                startRound();
            } else {
                setTimeout(function(){ startRound(); }, 2000);
            }
        });

        var selectedRightSong = function() {
            audio.pause();
            audio.currentTime = 0;
            clearInterval(countdown);

            score = score + counter;
            $('#score').html(score);
            console.log("We have a winner!");
            new Audio("/sounds/right.mp3").play();
            FB.AppEvents.logEvent("selectedRightAnswer");

            if (!isMobile.any()) {
                $("#songsList").html($("#rightAnswerTemplate").tmpl());
            }
        };
        
        var selectedWrongSong = function() {
            audio.pause();
            audio.currentTime = 0;
            clearInterval(countdown);
                
            console.log("Wrong answer!");                
            new Audio("/sounds/wrong.mp3").play();
            FB.AppEvents.logEvent("selectedWrongAnswer");

            if (!isMobile.any()) {
                $("#songsList").html($("#wrongAnswerTemplate").tmpl());
            }
        };

        var countdown = setInterval(function() {
            counter--;
            $('#counter').html(counter);
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

function TMP_shareScoreToFacebook(message) {
    var url = 'http://www.facebook.com/dialog/feed?app_id=1667972823529106' +
        '&link=http://picktun.es' +
        '&picture=' +
        '&name=' + encodeURIComponent(message) + 
        '&description=' + encodeURIComponent('Play Name That Tune with strangers in a highly competitive music guessing game.') + 
        '&caption=picktun.es' + 
        '&display=popup'; 
    window.open(url, 
                'feedDialog', 
                'toolbar=0,status=0,width=560,height=350'
    ); 
}
