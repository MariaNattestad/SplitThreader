
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

// Linear genome
var test_linear = ["A|e-B|s","B|e-C|s"];


// Linear genome with tandem repeat
var test_tr_1 = ["A|e-B|s","B|e-B|s","B|e-C|s"];
var test_tr_2 = ["A|e-B|s","B|s-E|s","E|e-C|e","B|e-C|s","C|e-D|s"];
var test_tr_3 = ["A|e-B|s","B|e-B|s","B|e-C|s","C|e-D|s","C|s-C|e"];
var test_tr_4 = ["A|e-B|s","B|e-C|s","C|e-D|s","D|e-E|s","B|s-D|e","C|s-C|e"];


// Three connected components
var test_cc_3 = ["A|s-C|e","D|e-D|s","B|s-B|e"];


// One genomic variant
var test_variants_1 = [{"chrom1":"1", "pos1":30000, "strand1":"+", "chrom2":"2", "pos2":8000, "strand2": "-"}];
var test_genome_1 = [{"chromosome":"1", "size":50000}, {"chromosome":"2","size":10000}];

// Gene fusion 1
var test_gf_1 = [
	{"chrom1":"1","pos1":50100,"strand1":"-","chrom2":"2","pos2":1000,"strand2":"-"},
	{"chrom1":"2","pos1":1200,"strand1":"+","chrom2":"1","pos2":50200,"strand2":"-"},
	{"chrom1":"1","pos1":50400,"strand1":"+","chrom2":"2","pos2":1300,"strand2":"-"},
	{"chrom1":"1","pos1":50500,"strand1":"+","chrom2":"2","pos2":1500,"strand2":"+"}
];

var gene1 = {"name":"test1","chromosome":"1","start":50080,"end":50370};
var gene2 = {"name":"test2","chromosome":"2","start":1340, "end":1010};
var test_gf_1_genome = [{"chromosome":"1", "size":100000}, {"chromosome":"2","size":200000}];


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

/////////////////////////    Testing graph creation from genomic coordinates    //////////////////////////////

QUnit.test ( "graph creation from genomic variants test", function( assert ) {
	var g = new Graph();
	g.from_genomic_variants(test_variants_1,test_genome_1);

	assert.equal(dict_length(g.nodes),4);
	assert.equal(dict_length(g.edges),3);

	var a = new Point(g.nodes["1|0"],10000);
	var b = new Point(g.nodes["2|1"],2000);
	var c = new Point(g.nodes["2|0"],3000);
	assert.equal(g.distance_between_2_points(a,b),22000, "matches expected value");
	assert.equal(g.distance_between_2_points(b,c),7000, "matches expected value");
	assert.equal(g.distance_between_2_points(a,c),-1, "matches no path found");
});

QUnit.test ( "finding nodes from genomic location test", function( assert ) {
	var g = new Graph();
	g.from_genomic_variants(test_variants_1,test_genome_1);

	var a = g.point_by_genomic_location("1",10000);
	assert.equal(a.node,"1|0");
	assert.equal(a.pos,10000);

	var b = g.point_by_genomic_location("2",10000);
	assert.equal(b.node,"2|1");
	assert.equal(b.pos,2000);

	var c = g.point_by_genomic_location("2",3000);
	assert.equal(c.node,"2|0");
	assert.equal(c.pos,3000);

});


// gene fusions w/ PQ BFS robust to cycles


// QUnit.test ( "gene fusion detection from genomic variants test", function( assert ) {
// 	var g = new Graph();
// 	g.from_genomic_variants(test_gf_1,test_gf_1_genome);

// 	assert.equal(dict_length(g.nodes),10);
// 	assert.equal(dict_length(g.edges),12);

// 	var b = g.port_list_by_interval(gene1)
// 	assert.equal(b.length,8);

// });



// TO DO


// Make BFS robust to cycles
// Test gene fusion using drawing I already made in my notebook









