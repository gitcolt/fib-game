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
    quest: ''
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
    { name: "startGame",    from: ["joining", "showing-results"], to: "entering-lies"   },
    { name: "choose",       from: "entering-lies", to: "choosing-answers"   },
    { name: "reveal",       from: "choosing-answers", to: "revealing-answer"   },
    { name: "showResults",  from: "revealing-answer", to: "showing-results"   },
    { name: "newQuestion",  from: "revealing-answer", to: "entering-lies"   },
    { name: "join",  from: "showing-results", to: "joining"   }
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
    onnewQuestion: function(event, from, to) {
      vm.round++;
      $.getJSON("qwerty", function(question) {
        vm.quest = question.text;
      });
    },
    onshowResults: function(event, from, to) {
      goToGameScreen("results");
    }
  }
});

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
