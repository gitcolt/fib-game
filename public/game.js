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

var vm = new Vue({
  el: "#game",
  data: {
    debugMsg: 'This is the debug message',
    round: 0,
    counter: 0,
    currQuestion: '',
    lies: [],
    players: [],
    liesReady: false
  },
  methods: {
    startGame: function() {
      fsm.startGame();
    },
    cont: function() {
      cont();
    }
  }
});

var fsm = StateMachine.create({
  initial: "joining",
  events: [
    { name: "startGame",    from: ["joining", "showingResults"],  to: "enteringLies"    },
    { name: "choose",       from: "enteringLies",                 to: "choosingAnswers" },
    { name: "reveal",       from: "choosingAnswers",              to: "revealingAnswer" },
    { name: "showResults",  from: "revealingAnswer",              to: "showingResults"  },
    { name: "newQuestion",  from: "revealingAnswer",              to: "enteringLies"    },
    { name: "join",         from: "showingResults",               to: "joining"         }
  ],
  callbacks: {
    // Called on EVERY state
    onenterstate: function(event, from, to) {
      vm.debugMsg = this.current;
    },
    // Initialization
    onstartup: function(event, from, to) {
      goToGameScreen("join");
    },
    onstartGame: function(event, from, to) {
      vm.round = 0;
      goToGameScreen("main");
    },
    onenteringLies: function(event, from, to) {
      vm.liesReady = false;
      vm.lies = [];
      // TODO defer transition until response has been received
      $.getJSON("question", function(res) {
        vm.currQuestion = res.question;
        // Don't allow players to use "comp" as a name
        vm.lies.push({text: res.lie, author: "comp"});
      });
      // simulating players entering lies
      vm.lies.push({text: "google", author: vm.players[0].name});
      vm.lies.push({text: "giggle", author: vm.players[1].name});
    },
    onchoose: function(event, from, to) {
      vm.liesReady = true; 
    },
    onnewQuestion: function(event, from, to) {
      vm.round++;
    },
    onshowResults: function(event, from, to) {
      goToGameScreen("results");
    },
    onjoining: function(event, from, to) {
      //replace with real chromecast messages
      // vm.joining = true;
      simulatedPlayersJoining();
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
