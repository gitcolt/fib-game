var app = new Vue({
    el: '#a',
    data: {
        asdf: 'WORLD!',
        items: [
            "one",
            "two"
        ]
    },
    methods: {
        aaaa: function(){
            func();
        }
    }
});

function func() {
    $.getJSON("qwerty", function(result){
        app.asdf = result.text; 
    });
    //app.asdf = responsetext?;
}
