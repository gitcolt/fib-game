function goToGameScreen(screen) {
  $(".screen").hide();
  switch(screen) {
    case "main":
      $("#main-container").show();
      break;
    case "join":
      $("#joining-container").show();
      break;
    case "results":
      $("#results-container").show();
      break;
    default:
      console.log("Error: invalid game screen");
  }
}

Vue.component('scores-slideout', {
  template: '#scores-slideout',
  props: ['players', 'is-showing-scores']
});

var vm = new Vue({
  el: "#game",
  data: {
    debugMsg: 'This is the debug message',
    round: 0,
    counter: 0,
    currQuestion: '',
    answers: [],
    players: [],
    answersReady: false,
    revealAnim: 'reveal_anim',
    isShowingScores: false
  },
  methods: {
    startGame: function() {
      fsm.startGame();
    },
    reveal: function(ansPos) {
      if (ansPos >= this.answers.length) {
        // Transition to updateScores when all answers have been revealed
        fsm.updateScores(); 
      } else {
        this.answers[ansPos].isRevealing = true;
      }
    },
    cont: function() {
      cont();
    }
  }
});

var fsm = StateMachine.create({
  initial: "registeringPlayers",
  events: [
    { name: "startGame",        from: [ "registeringPlayers",
                                        "showingResults"],    to: "startingGame"        },
    { name: "acceptAnswers",    from:   "acceptingLies",      to: "acceptingAnswers"    },
    { name: "reveal",           from:   "acceptingAnswers",   to: "revealingAnswer"     },
    { name: "updateScores",     from:   "revealingAnswer",    to: "updatingScores"      },
    { name: "showResults",      from:   "updatingScores",     to: "showingResults"      },
    { name: "fetchNewQuestion", from: [ "startingGame", 
                                        "updatingScores"],    to: "fetchingNewQuestion" },
    { name: "acceptLies",       from:   "fetchingNewQuestion",to: "acceptingLies"       },
    { name: "registerPlayers",  from:   "showingResults",     to: "registeringPlayers"  }
  ],
  callbacks: {
    // Called on EVERY state
    onenterstate: function() {
      vm.debugMsg = this.current;
    },

    // ON STARTUP (initialization)
    onstartup: function() {
      goToGameScreen("join");
    },

    // ON START GAME
    onstartGame: function() {
      vm.round = 0;
      for (var i = 0; i < vm.players.length; i++) {
        var player = vm.players[i];
        player.score = 0;
      }
      goToGameScreen("main");
      fsm.fetchNewQuestion();
    },

    // ON ACCEPT ANSWERS
    onacceptAnswers: function() {
      shuffle(vm.answers); 
      vm.answersReady = true; 
      var answersReadyMessage = {"action": "answers ready", "answers": vm.answers};
      window.messageBus.broadcast(JSON.stringify(answersReadyMessage));
      // simulating players choosing answers
      setTimeout(function() {
        //vm.answers[1].chosenBy.push(vm.players[0].name);
        //vm.answers[2].chosenBy.push(vm.players[1].name);
        fsm.reveal();
      }, 4000); // Wait 4 seconds for players to choose answers
    },

    // ON NEW QUESTION
    onfetchNewQuestion: function() {
      vm.answers = [];
      vm.answersReady = false;
      vm.isShowingScores = false;
      $.getJSON("question", function(res) {
        vm.currQuestion = res.question;
        // Push computer's true answer
        vm.answers.push(
          {text: res.answer,  author: "comp", chosenBy: [], isCorrect: true,  isRevealing: false});
        // Push computer's lie
        vm.answers.push(
          {text: res.lie,     author: "comp", chosenBy: [], isCorrect: false, isRevealing: false});

        fsm.acceptLies();
      });
    },

    // ON ACCEPT LIES
    onacceptLies: function() {
      var newQuestionMessage = {"action": "new question", "question": vm.currQuestion};
      window.messageBus.broadcast(JSON.stringify(newQuestionMessage));
      setTimeout(function() {
        /*vm.answers.push(
          {text: "google", author: vm.players[0].name, chosenBy: [], isCorrect: false, isRevealing: false});
          vm.answers.push(
          {text: "giggle", author: vm.players[1].name, chosenBy: [], isCorrect: false, isRevealing: false});
        */
        fsm.acceptAnswers();
      }, 4000); // Wait 4 seconds for all lies to be entered
    },

    // ON SHOW RESULTS
    onshowResults: function() {
      var showResultsMessage = {"action": "show results"}
      window.messageBus.broadcast(JSON.stringify(showResultsMessage));
      goToGameScreen("results");
    },

    // ON REVEAL
    onreveal: function() {
      vm.answers[0].isRevealing = true;
      //transitioning after last answer is revealed instead
      /*
      setTimeout(function() {
        fsm.updateScores();
      }, 4000);
      */
    },

    // ON REGISTERING PLAYERS
    onregisteringPlayers: function() {
      //replace with real chromecast messages
      // Don't allow players to use "comp" as a name

      //simulatedPlayersJoining();
    },

    // ON UPDATE SCORES
    onupdateScores: function() {
      vm.isShowingScores = true;
      setTimeout(function() {
        for (let i = 0; i < vm.answers.length; i++) {
          var answer = vm.answers[i];
          // Award 1000 points to each player who chose the correct answer
          if(answer.isCorrect) {
            var choosers = getChoosersOf(answer);
            for (let i = 0; i < choosers.length; i++) {
              choosers[i].score += 1000;
              // Notify sender of correct answer chosen
              var correctAnswerMessage = {"action": "correct answer"}; 
              window.messageBus.send(choosers[i].id, JSON.stringify(correctAnswerMessage));
            }
            // Award 500 points to each player the author successfully fooled
          } else if (!answer.isCorrect && answer.author != "comp") {
            var author = getAuthorOf(answer);
            for (let i = 0; i < answer.chosenBy.length; i++) {
              author.score += 500;
              // 
            }
          }
        }
        // Rearrange players in descending score order
        // This will be reflected in the score display
        vm.players.sort(function(a, b) {
          return b.score - a.score;
        });
      }, 1000); // Wait 1 second after showing the score slider to update the scores

      setTimeout(function() {
        if (vm.round >= 3) {
          fsm.showResults();
        } else {
          vm.round++;
          fsm.fetchNewQuestion();
        }
      }, 3000); // Wait 3 seconds after showing the score slider to either fetch new question or show final results
    },

    // ON LEAVE SHOWING RESULTS
    onleaveshowingResults: function() {
      vm.isShowingScores = false;
    }
  }
});

// Returns the player who authored the lie
function getAuthorOf (answer) {
  let author = vm.players.filter(function(player) {
    return player.name == answer.author;
  })[0];
  return author;
}

// Returns array of players who chose the provided answer
function getChoosersOf (answer) {
  var choosers = [];
  for (let i = 0; i < answer.chosenBy.length; i++) {
    let nameOfChooser = answer.chosenBy[i];
    let player = vm.players.filter(function(player) {
      return player.name == nameOfChooser;
    })[0];
    choosers.push(player);
  }
  return choosers;
}

function simulatedPlayersJoining() {
  vm.players.push({name: "Colt", score: 0});
  vm.players.push({name: "Kim", score: 0});
}

function shuffle (array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function cont() {
  switch(vm.counter) {
    case 0:
      fsm.startGame();
      break;
    case 1:
      fsm.reveal();
      break;
    case 2:
      fsm.updateScores();
      break;
    case 3:
      if (vm.round >=3) {
        fsm.showResults();
      } else {
        fsm.newQuestion();
      }
      vm.counter = 0;
      return;
      break;
    default:
      console.log("error");
      break;
  }
  vm.counter++;
}
