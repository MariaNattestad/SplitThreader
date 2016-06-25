class Node {
	constructor(id,chrom,start,end) {
		this.id = id;
		this.chrom = chrom;
		this.start = start;
		this.end = end;
	}
}

var nodes = {};
var edges = {};

function build_SplitThreader_graph(connection_data,genome_data) {
	//	connection_data: chrom1, pos1, strand1, chrom2, pos2, strand2
	//	genome_data: 
	console.log("build_SplitThreader_graph")
	// console.log(connection_data)

	var positions_by_chrom = {};

	//  Add ends of chromosomes first
	for (var i = 0; i < genome_data.length; i++) {
		positions_by_chrom[genome_data.chromosome] = [genome_data.size]; 
	}

	// Add breakpoints
	for (var i = 0; i < connection_data.length; i++) {
		if (positions_by_chrom.hasOwnProperty(connection_data[i].chrom1)) {
				positions_by_chrom[connection_data[i].chrom1].push(connection_data[i].pos1);
		} else {
				positions_by_chrom[connection_data[i].chrom1] = [];
		}
		if (positions_by_chrom.hasOwnProperty(connection_data[i].chrom2)) {
				positions_by_chrom[connection_data[i].chrom2].push(connection_data[i].pos2);
		} else {
				positions_by_chrom[connection_data[i].chrom2] = [];
		}
	}
	for (var chrom in positions_by_chrom) {
		var positions = positions_by_chrom[chrom];
		console.log(positions);
		var previous_position = 0;
		for (var i = 0; i < positions.length; i++) {
			nodes[chrom + "|" + i] = new Node(chrom + "|" + i,chrom,previous_position,positions[i]);
			previous_position = positions[i];
		}
	}

	console.log(nodes);


}
