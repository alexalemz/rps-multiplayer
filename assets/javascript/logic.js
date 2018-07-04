// Have player 1 select something, store the choice
// Have player 2 select something, store the choice
// Compute the winner, or if it's a draw.

var playerChoice = {};
var winCount = { one: 0, two: 0, tie: 0 };
var winner;

const possibleChoices = ['rock','paper','scissors'];

var currentPlayer;

// Initialize Firebase
var config = {
    apiKey: "AIzaSyBbx8g5eTrd1dqPBUdO4GLt4CX9hX8uAEQ",
    authDomain: "test-38cb0.firebaseapp.com",
    databaseURL: "https://test-38cb0.firebaseio.com",
    projectId: "test-38cb0",
    storageBucket: "test-38cb0.appspot.com",
    messagingSenderId: "928075072393"
  };
firebase.initializeApp(config);

var database = firebase.database();
var rpsRef = database.ref('/rps');

rpsRef.on('value', function(snap) {
    // Check which player we are.
    if (currentPlayer === undefined) {
        if (!snap.child('one').exists()) {
            currentPlayer = 'one';
            rpsRef.update({
                one: true
            });
        }
        else if (snap.child('one').exists() && !snap.child('two').exists()) {
            currentPlayer = 'two';
            rpsRef.update({
                two: true
            });
        }
        else {
            // Two people are already playing.
            return;
        }
        
        // Remove the player from the database upon disconnect.
        var updateObj = {};
        updateObj[currentPlayer] = null;
        updateObj['reset'] = true;
        console.log('upon disconnect', updateObj);
        rpsRef.onDisconnect().update(updateObj);
    }
    console.log('current player', currentPlayer);

    // If winCount exists, load it
    if (snap.child('winCount').exists()) {
        winCount = snap.val().winCount;

        // Update score display
        $('#p1wins').text(winCount.one);
        $('#p2wins').text(winCount.two);
        $('#ties').text(winCount.tie);
    }

    // If we need to reset some stuff
    if (snap.child('reset').exists()) {
        if (snap.val().reset) {
            // Call the reset function
            reset();
            // Update reset to false
            rpsRef.update({reset: false});
            // Don't execute anything else
            return;
        }
    }
    
    // Fade the other player's column
    var cpstring;
    if (currentPlayer === 'one') cpstring = 2;
    else if (currentPlayer === 'two') cpstring = 1;
    console.log('cpstring', cpstring);
    if (!snap.child('oneChoice').exists() || !snap.child('twoChoice').exists()) {
        $('.player-column:nth-child(' + cpstring + ')').css({'opacity': 0.3});
    }

    // If both players' choices are in the database, 
    // fill playerChoice with both choices.
    // Display the other player's choice.
    // Calculate the winner and display the winner.
    if (snap.child('oneChoice').exists() && snap.child('twoChoice').exists() && !winner) {
        // playerChoice['one'] = snap.val().oneChoice;
        // playerChoice['two'] = snap.val().twoChoice;

        playerChoice = {
            one: snap.val().oneChoice,
            two: snap.val().twoChoice
        }
        // Unfade the other player's column
        $('.col:nth-child(' + cpstring + ')').css({'opacity': 1.0});
        displayChoice(otherPlayer());
        // Calculate and display winner
        calculateWinner();
        displayWinner();
    }
});

function otherPlayer() {
    return (currentPlayer === 'one') ? 'two' : 'one';
}

$(document).ready(function() {
    $('#content').load('assets/snippets/game.html', function() {
    });
});

// When a RPS Button is clicked on...
$(document).on('click', '.rps-button', function() {
    // Don't let the player click if both player's have already chosen.
    if (playerChoice['one'] && playerChoice['two'])
        return;

    // Find the value of the button (rock,paper,scissors)
    var thisButton = $(this);
    var choice = thisButton.attr('data');

    // Find out which player's buttons these are
    var div = thisButton.closest('.buttons-div');
    var player = div.attr('data-player');

    // Don't let the currentPlayer click on the wrong set of buttons
    if (currentPlayer !== player) return;

    playerChoice[player] = choice;

    // Update Firebase with the player's choice
    var updateObj = {};
    updateObj[player + 'Choice'] = choice;
    rpsRef.update(updateObj);

    // Display the choice on the page
    displayChoice(player, choice);

    console.log('player', player);
    console.log("This click is working");
    console.log(playerChoice);

    // if (playerChoice['one']) {
    //     if (!playerChoice['two']) {
    //     }
    //     else {
    //         console.log('Both players have chosen');
    //         calculateWinner();
    //         displayWinner();
    //     }
    // }
});

function calculateWinner() {
    var p1_index = possibleChoices.indexOf(playerChoice.one);
    var p2_index = possibleChoices.indexOf(playerChoice.two);

    // var winner;

    if (p1_index === p2_index)
        winner = 'tie';
    // If p1_index is one greater than p2_index, player one is the winner.
    else if (p1_index === (p2_index + 1) % 3 ) {
        winner = 'one';
    }
    // Otherwise p1_index is one less than p2_index
    else {
        winner = 'two';
    }

    // Update win count
    winCount[winner]++;
    console.log('win count', winCount);
    // var updateObj = {};
    // updateObj[]
    rpsRef.update({
        winCount: winCount
    });

    // return winner;
}

function displayWinner() {
    var target = $('#game-results');
    if (winner === 'tie') {
        target.html("It's a tie.");
    }
    else {
        var loser = (winner === 'one') ? 'two' : 'one';
        var action;
        switch (playerChoice[winner]) {
            case 'paper':
                action = ' covers '; break;
            case 'scissors':
                action = ' cuts '; break;
            case 'rock':
                action = ' smashes '; break;
        }
        target.html(playerChoice[winner] + action + playerChoice[loser] + '<br>');
        target.append('Player ' + winner + ' wins!');
    }
    
}

function displayChoice(player) {
    var idname = (player === 'one') ? 'player1choice' : 'player2choice';
    var target = $('#' + idname);

    // Create an icon span
    var span = $('<span>');
    var className = "fas fa-hand-" + playerChoice[player];
    var i = $('<i>').addClass(className);
    span.append(i);

    span.attr({
        style: "font-size: 64px; color: charcoal;"
    })

    target.html(span);
}

// When restart button is clicked...
$(document).on('click', '#restartButton', function() {
    // Make sure only a player can reset the game
    if (!currentPlayer) return;
    
    rpsRef.update({
        reset: true
    });
})

function reset() {
    playerChoice = {};
    rpsRef.update({
        oneChoice: null,
        twoChoice: null
    })
    $('#game-results').empty();
    $('.playerchoice').html("Choose your weapon");
    winner = null;
}