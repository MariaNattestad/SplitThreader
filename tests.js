
function fast_graph(edgelist) {
	var output = [];
	for (var i = 0; i < edgelist.length; i++) {
		short_string = edgelist[i];
		var sides = short_string.split("-");
		var side1 = sides[0].split("|");
		var side2 = sides[1].split("|");
		output.push({node1:side1[0],port1:side1[1],node2:side2[0],port2:side2[1]});
	}
	return output;
}


// Circular genome with one tandem repeat
var test_1 = ["A|e-B|e","B|e-C|e","C|s-B|s","B|s-A|s"]; // same as above


// Gene fusion 1
// var test_gf_1 = 

// Linear genome
var test_linear = ["A|e-B|s","B|e-C|s"];


// Linear genome with tandem repeat
var test_tr_1 = ["A|e-B|s","B|e-B|s","B|e-C|s"];
var test_tr_2 = ["A|e-B|s","B|s-E|s","E|e-C|e","B|e-C|s","C|e-D|s"];
var test_tr_3 = ["A|e-B|s","B|e-B|s","B|e-C|s","C|e-D|s","C|s-C|e"];
var test_tr_4 = ["A|e-B|s","B|e-C|s","C|e-D|s","D|e-E|s","B|s-D|e","C|s-C|e"];


// Three connected components
var test_cc_3 = ["A|s-C|e","D|e-D|s","B|s-B|e"];





function dict_length(dictionary) {
	var num = 0;
	for (var k in dictionary) {num++;}
	return num;
}

QUnit.test ( "graph creation test", function( assert ) {
	var g = new Graph();
	g.from_edge_list(fast_graph(test_1));

	assert.equal(dict_length(g.nodes),3);
	assert.equal(dict_length(g.edges),4);
});

QUnit.test ( "glide test", function( assert ) {
	
	var g = new Graph();
	g.from_edge_list(fast_graph(test_1));

	for (var nodename in g.nodes) {
		assert.equal(g.nodes[nodename].start, g.nodes[nodename].end.glide,"basic glide");
		assert.equal(g.nodes[nodename].start, g.nodes[nodename].start.glide.glide,"double glide");
		assert.ok(g.nodes[nodename].start.glide.edges != [],"ports updating by reference properly");
	}
});


QUnit.test ( "travel test", function( assert ) {
	
	var g = new Graph();
	g.from_edge_list(fast_graph(test_1));
	// Edge coming out of A|e matches one of the edges coming out of B|e (specific to this toy example)
	assert.ok(g.nodes["A"].end.edges[0].edge == g.nodes["B"].end.edges[0].edge || g.nodes["A"].end.edges[0].edge == g.nodes["B"].end.edges[1].edge);
	// Port A|e matches Port A|e from B|e's edge list
	assert.ok(g.nodes["A"].end == g.nodes["A"].end.edges[0].port.edges[0].port || g.nodes["A"].end == g.nodes["A"].end.edges[0].port.edges[1].port);

});


QUnit.test ( "simple bfs test", function (assert) {
	var g = new Graph();
	g.from_edge_list(fast_graph(test_1));
	
	var a = new Point(g.nodes["A"],90);
	var b = new Point(g.nodes["B"],90);
	var c = new Point(g.nodes["C"],30);
	assert.equal(g.distance_between_2_points(a,b),20, "matches expected value"); // 10 to end of A, 10 from start of B
	assert.equal(g.distance_between_2_points(a,c),140, "matches expected value"); // 10 to end of A, 100 for whole B, 30 from start of C to point
	assert.equal(g.distance_between_2_points(c,a),g.distance_between_2_points(a,c), "reversible");
	assert.equal(g.distance_between_2_points(c,b),g.distance_between_2_points(b,c), "reversible");
	assert.equal(g.distance_between_2_points(a,b),g.distance_between_2_points(b,a), "reversible");

});



QUnit.test ( "basic traversal test", function (assert) {
	var linear = new Graph();
	linear.from_edge_list(fast_graph(test_linear));
	assert.equal(linear.get_unvisited().length,6,"before traversal");
	linear.df_traverse();
	assert.equal(linear.get_unvisited().length,0,"after traversal");

	var tandem_1 = new Graph();
	tandem_1.from_edge_list(fast_graph(test_tr_1));
	assert.equal(tandem_1.get_unvisited().length,6,"before traversal");
	tandem_1.df_traverse();
	assert.equal(tandem_1.get_unvisited().length,0,"after traversal");

});


QUnit.test ( "count connected components test", function (assert) {
	var linear = new Graph();
	linear.from_edge_list(fast_graph(test_linear));
	assert.equal(linear.count_connected_components(),1);

	var cc_3 = new Graph();
	cc_3.from_edge_list(fast_graph(test_cc_3));
	assert.equal(cc_3.count_connected_components(),3);

});


// QUnit.test ( "tandem repeat detection test", function (assert) {
// 	var linear = new Graph();
// 	linear.from_edge_list(fast_graph(test_linear));
// 	assert.equal(linear.count_tandem_repeats(),0);

// 	var tandem_1 = new Graph();
// 	tandem_1.from_edge_list(fast_graph(test_tr_1));
// 	assert.equal(tandem_1.count_tandem_repeats(),1);

// 	var tandem_2 = new Graph();
// 	tandem_2.from_edge_list(fast_graph(test_tr_2));
// 	assert.equal(tandem_2.count_tandem_repeats(),1);

// 	var tandem_3 = new Graph();
// 	tandem_3.from_edge_list(fast_graph(test_tr_3));
// 	assert.equal(tandem_3.count_tandem_repeats(),2);

// 	var tandem_4 = new Graph();
// 	tandem_4.from_edge_list(fast_graph(test_tr_4));
// 	assert.equal(tandem_3.count_tandem_repeats(),2);


// });










