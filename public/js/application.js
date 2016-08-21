var Game = (function() {
    var songs;
    var counter;
    var score = 0;
    var round = 0;

    var startRound = function() {
        round++;
        counter = 20;

        if (round > 10) {
            console.log("Game Over!");
            $.post("/endgame", { score: score }).done(function(data) {
                window.location.replace("/scoreboard?last_game_id=" + data.last_game_id);
            });
            $('#content').html($('#pleaseWait').tmpl());
            return;
        }

        $('#counter').html(counter)

        roundSongs = Game.songs.splice(0,4);
        selectedSong = roundSongs[Math.floor(Math.random() * roundSongs.length)];
        //console.log(selectedSong);

        console.log("Score: " + score + " Round: " + round);
        $('#round').html(round);

        var audio = new Audio(selectedSong['audio']);
        audio.play();

        $("#songsList").html($("#songsTemplate").tmpl(roundSongs));

        $('.song a').click(function() {
            if ($(this).data('id') == selectedSong['id']) {
                /* correct answer */
                score = score + counter;
                $('#score').html(score);
                console.log("We have a winner!");
                new Audio("/sounds/right.mp3").play();
                notify('You got it!');
            } else {
                /* wrong answer */
                console.log("Wrong answer!");                
                new Audio("/sounds/wrong.mp3").play();
            }
            audio.pause();
            audio.currentTime = 0;
            clearInterval(countdown);
            startRound();
        });


        var countdown = setInterval(function() {
            counter--;
            $('#counter').html(counter);
            if (counter == 0) {
                console.log("Times up!");
                new Audio("/sounds/wrong.mp3").play();

                audio.pause();
                audio.currentTime = 0;
                clearInterval(countdown);
                startRound();
            }
        }, 1000);

    };

    var notify = function(msg) {
        $('#message').show();
        $('#message span').html(msg);
        setTimeout(function() {
            $('#message').hide();
        }, 3000);
    };
    
    return {
        startRound: startRound
    };
 
})();