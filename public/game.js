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
    reveal: function(index) {
      if (index >= this.answers.length) {
        //setTimeout transition to score update
        
      } else {
        this.answers[index].isRevealing = true;
      }
    },
    cont: function() {
      cont();
    }
  }
});

var fsm = StateMachine.create({
  initial: "joining",
  events: [
    { name: "startGame",    from: ["joining", "showingResults"],  to: "submittingLies"    },
    { name: "choose",       from: "submittingLies",               to: "choosingAnswers" },
    { name: "reveal",       from: "choosingAnswers",              to: "revealingAnswer" },
    { name: "updateScores", from: "revealingAnswer",              to: "updatingScores"  },
    { name: "showResults",  from: "updatingScores",               to: "showingResults"  },
    { name: "newQuestion",  from: "updatingScores",               to: "submittingLies"    },
    { name: "join",         from: "showingResults",               to: "joining"         }
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

    // ON STAR GAME
    onstartGame: function() {
      vm.round = 0;
      goToGameScreen("main");
    },

    // ON SUBMITTING LIES
    onsubmittingLies: function() {
      vm.answersReady = false;
      vm.answers = [];
      // TODO defer transition until response has been received
      $.getJSON("question", function(res) {
        vm.currQuestion = res.question;
        // Push computer's true answer
        vm.answers.push(
          {text: res.answer,  author: "comp", chosenBy: [], isCorrect: true,  isRevealing: false});
        // Push computer's lie
        vm.answers.push(
          {text: res.lie,     author: "comp", chosenBy: [], isCorrect: false, isRevealing: false});
      });
      // simulating players entering lies
      vm.answers.push(
        {text: "google", author: vm.players[0].name, chosenBy: [], isCorrect: false, isRevealing: false});
      vm.answers.push(
        {text: "giggle", author: vm.players[1].name, chosenBy: [], isCorrect: false, isRevealing: false});
    },

    // ON CHOOSE
    onchoose: function() {
      vm.answersReady = true; 
      // simulating players choosing answers
      vm.answers[1].chosenBy.push(vm.players[0].name);
      vm.answers[2].chosenBy.push(vm.players[1].name);
    },

    // ON NEW QUESTION
    onnewQuestion: function() {
      vm.isShowingScores = false;
      vm.round++;
    },

    // ON SHOW RESULTS
    onshowResults: function() {
      goToGameScreen("results");
    },

    // ON REVEAL
    onreveal: function() {
      vm.answers[0].isRevealing = true;
    },

    // ON JOINING
    onjoining: function() {
      //replace with real chromecast messages
      // vm.joining = true;
      // Don't allow players to use "comp" as a name
      simulatedPlayersJoining();
    },

    // ON UPDATE SCORES
    onupdateScores: function() {
      vm.isShowingScores = true;
      setTimeout(function() {
        for (let i = 0; i < vm.answers.length; i++) {
          var answer = vm.answers[i];
          if(answer.isCorrect) {
            for (let i = 0; i < answer.chosenBy.length; i++) {
              let chosenBy = answer.chosenBy[i];
              let player = vm.players.filter(function(player) {
                return player.name == chosenBy;
              })[0];
              player.score += 1000;
            }
          } else if (!answer.isCorrect) {
            var author = vm.players.filter(function(player) {
              return player.name == answer.author;
            })[0];
            for (player in answer.chosenBy) {
              author.score += 500; 
            }
          }
        }
      }, 1000);
    },

    // ON LEAVE SHOWING RESULTS
    onleaveshowingResults: function() {
      vm.isShowingScores = false;
    }
  }
});

function simulatedPlayersJoining() {
  vm.players.push({name: "Colt", score: 0});
  vm.players.push({name: "Kim", score: 0});
}

function cont() {
  switch(vm.counter) {
    case 0:
      fsm.choose();
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
