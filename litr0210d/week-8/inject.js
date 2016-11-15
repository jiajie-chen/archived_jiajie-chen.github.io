var grammarObj = {
	"S": [
		"Every day is #goodAdj# with you in it.",
		"Fight #badAction#.",
		"Stand up to #badAction#.",
		"You are a person with value.",
		"People #goodAction# you.",
		"#goodAction.capitalize# others."],

	"goodAdj": ["beautiful", "better", "exciting", "brighter", "interesting", "incredible"],
	"goodAction": ["love", "care about", "like", "value", "accept"],
	"badAction": ["bigotry", "hate", "racism", "sexism", "ableism", "white supremacy", "toxic masculinity", "violence"]
};
var grammar = tracery.createGrammar(grammarObj);

$('p').each(function() {
	if (Math.floor((Math.random*5)) > 1) {
		return;
	}

	var t = " " + grammar.flatten("#S#");
	console.log(t);
	$(this).append(t);
})