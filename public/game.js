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
    answers: [],
    players: [],
    answersReady: false,
    revealAnim: 'reveal_anim'
  },
  methods: {
    startGame: function() {
      fsm.startGame();
    },
    reveal: function(index) {
      if (index >= this.answers.length) {
        //setTimeout transition to results
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
      vm.answersReady = false;
      vm.answers = [];
      // TODO defer transition until response has been received
      $.getJSON("question", function(res) {
        vm.currQuestion = res.question;
        // Push computer's true answer
        vm.answers.push(
          {text: res.answer,  author: "comp", isCorrect: true,  isRevealing: false});
        // Push computer's lie
        vm.answers.push(
          {text: res.lie,     author: "comp", isCorrect: false, isRevealing: false});
      });
      // simulating players entering lies
      vm.answers.push(
        {text: "google", author: vm.players[0].name, isCorrect: false, isRevealing: false});
      vm.answers.push(
        {text: "giggle", author: vm.players[1].name, isCorrect: false, isRevealing: false});
    },
    onchoose: function(event, from, to) {
      vm.answersReady = true; 
      // simulating players choosing answers
      vm.answers[0].chosenBy = vm.players[0].name;
      vm.answers[1].chosenBy = vm.players[1].name;
    },
    onnewQuestion: function(event, from, to) {
      vm.round++;
    },
    onshowResults: function(event, from, to) {
      goToGameScreen("results");
    },
    onreveal: function(event, from, to) {
      vm.answers[0].isRevealing = true;
    },
    onjoining: function(event, from, to) {
      //replace with real chromecast messages
      // vm.joining = true;
      // Don't allow players to use "comp" as a name
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
