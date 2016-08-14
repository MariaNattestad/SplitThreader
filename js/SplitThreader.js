class Graph {
	constructor() {
		this.nodes = {}; // key: node_name, value: Node
		this.edges = {}; // key: edge_name, value: Edge
		this.genomic_node_lookup = {}; // key: (chrom,pos,s/e) value: node_name
		this.genomic_sorted_positions = {}; // key: chrom, value: [list of positions]
	}
}

class Node {
	constructor(id) {
		this.id = id;
		this.start = new Port();
		this.end = new Port();
		this.length = 100;

		this.start.id = this.id + "|s";
		this.end.id = this.id + "|e";
		// Set glide for both ports to each other
		this.start.glide = this.end;
		this.end.glide = this.start;
		this.start.node = this;
		this.end.node = this;

		// Flexible lookup dictionary for when ports are named "s" and "e"
		this.ports = {"s":this.start,"e":this.end};
		this.genomic_coordinates = null;
	}
}

class Port {
	constructor() {
		this.edges = []; // {edge:Edge, port:Port}
		this.glide;
		this.id;
		this.node;
	}
}

Port.prototype.toString = function() {
	return this.id;
}

class Edge {
	constructor(id,node1,port1,node2,port2) {
		this.id = id;
		this.node1_id = node1;
		this.node1_port = port1;
		this.node2_id = node2;
		this.node2_port = port2;
		this.variant_name = null;
	}
}

class Point {
	constructor(node,pos) {
		if (node instanceof Node) {
			this.node = node;
			this.pos = pos;
			this.name = "";
			this.distance = {"s":pos,"e":node.length-pos};
		} else {
			console.log("ERROR: Point must be given a node, not a node_name");
		}
	}
}



////////////    Creating the graph    ////////////////////////

Graph.prototype.from_edge_list = function(input) {
	this.nodes = {}; // empty for cleanup in case of reloading file in future code
	this.edges = {}; // empty for cleanup in case of reloading file in future code
	for (var i = 0; i < input.length; i++) {
		this.nodes[input[i].node1] = new Node(input[i].node1);
		this.nodes[input[i].node2] = new Node(input[i].node2);
	}
	for (var i=0; i < input.length; i++) {
		var e = input[i];
		this.edges[i] = new Edge(i, e.node1,e.port1,e.node2,e.port2);
		this.nodes[e.node1].ports[e.port1].edges.push({   edge:this.edges[i],   port:this.nodes[e.node2].ports[e.port2]   });
		this.nodes[e.node2].ports[e.port2].edges.push({   edge:this.edges[i],   port:this.nodes[e.node1].ports[e.port1]   });
	}
}


Graph.prototype.from_genomic_variants = function(variants,chromosome_sizes) {
	this.nodes = {}; // empty for cleanup in case of reloading file
	this.edges = {}; // empty for cleanup in case of reloading file
	
	var positions_by_chrom = {};

	//  Add ends of chromosomes first
	for (var i = 0; i < chromosome_sizes.length; i++) {
		positions_by_chrom[chromosome_sizes[i].chromosome] = [chromosome_sizes[i].size]; 
	}

	// Add breakpoints
	for (var i = 0; i < variants.length; i++) {
		variants[i].good = false;
		if (positions_by_chrom[variants[i].chrom1] == undefined) {
			console.log("Ignoring " + variants[i].variant_name + " because chromosome " + variants[i].chrom1 + " is not in genome set");
		} else if (positions_by_chrom[variants[i].chrom2] == undefined) {
			console.log("Ignoring " + variants[i].variant_name + " because chromosome " + variants[i].chrom2 + " is not in genome set");
		} else {
			if (variants[i].pos1 > positions_by_chrom[variants[i].chrom1]) {
				console.log("Variant outside chromosome size range");
				console.log(variants[i]);
			} else if (variants[i].pos2 > positions_by_chrom[variants[i].chrom2]) {
				console.log("Variant outside chromosome size range");
				console.log(variants[i]);
			} else {
				positions_by_chrom[variants[i].chrom1].push(variants[i].pos1);
				positions_by_chrom[variants[i].chrom2].push(variants[i].pos2);
				variants[i].good = true;
			}
		}
	}

	// Create nodes between the breakpoints and link them with edges
	for (var chrom in positions_by_chrom) {
		var positions = positions_by_chrom[chrom];
		positions.sort(function(a, b){return a-b});
		this.genomic_sorted_positions[chrom] = positions;

		var previous_position = 0;
		for (var i = 0; i < positions.length; i++) {
			var node_name = chrom + "|" + i;
			this.nodes[node_name] = new Node(node_name);
			this.nodes[node_name].genomic_coordinates = {"chrom":chrom,"start":previous_position,"end":positions[i]};
			this.nodes[node_name].length = positions[i]-previous_position;
			this.genomic_node_lookup[[chrom,previous_position,"s"]] = node_name;
			this.genomic_node_lookup[[chrom,positions[i],"e"]] = node_name;
			previous_position = positions[i];
		}
	}

	//  Create edges
	var edge_name_counter = 0;
	for (var i = 0; i < variants.length; i++) {
		if (variants[i].good == true) {
			var v = variants[i];

			var port1 = strand_to_port(v.strand1);
			var node1 = this.genomic_node_lookup[[v.chrom1,v.pos1,port1]];

			var port2 = strand_to_port(v.strand2);
			var node2 = this.genomic_node_lookup[[v.chrom2,v.pos2,port2]];

			// Split and 2 spanning edges
			this.create_edge(edge_name_counter,     node1, port1, node2, port2); // split edge
			this.edges[edge_name_counter].variant_name = variants[i].variant_name; // split edge gets variant name
			this.create_edge(edge_name_counter + 1, node1, port1, this.genomic_node_lookup[[v.chrom1,v.pos1,opposite_port(port1)]], opposite_port(port1)); // spanning edge for node 1
			this.create_edge(edge_name_counter + 2, this.genomic_node_lookup[[v.chrom2,v.pos2,opposite_port(port2)]], opposite_port(port2), node2, port2); // spanning edge for node 2 
			edge_name_counter += 3; 

		}
	}

	// console.log("this.edges:");
	// console.log(this.edges);

}

Graph.prototype.create_edge = function(edge_name,node1,port1,node2,port2) {
	this.edges[edge_name] = new Edge(edge_name, node1, port1, node2, port2);
	this.nodes[node1].ports[port1].edges.push({   edge:this.edges[edge_name],   port:this.nodes[node2].ports[port2]   });
	this.nodes[node2].ports[port2].edges.push({   edge:this.edges[edge_name],   port:this.nodes[node1].ports[port1]   });
}

function opposite_port(port) {
	if (port == "s") {
		return "e";
	} else if (port == "e") {
		return "s";
	} else {
		console.log("ERROR: port must be s or e in opposite_port");
	}
}
function strand_to_port(strand) {
	var port = "s";
	if (strand == "+") {
		port = "e";
	} else if (strand == "-") {
		port = "s";
	} else {
		console.log("ERROR strand not recognized, must be + or -, but it is ", strand)
	}
	return port;
}

//////////////////   Distance calculations    ////////////////////

Graph.prototype.distance_between_2_points = function(point1,point2) {
	// Translate both points into node ports plus distances
	//  create lists of [distance,Port]
	var list1 = [[point1.distance["e"],point1.node.ports["e"]],[point1.distance["s"],point1.node.ports["s"]]];
	var list2 = [[point2.distance["e"],point2.node.ports["e"]],[point2.distance["s"],point2.node.ports["s"]]];

	return this.bfs(list1,list2);
}

Graph.prototype.unvisit_all = function() {
	for (var node_name in this.nodes) {
		this.nodes[node_name].start.visited = false;
		this.nodes[node_name].end.visited = false;
	}
}
Graph.prototype.bfs = function(list1,list2) {
	arbitrary_depth_limit = 100000;

	this.unvisit_all();

	// Enqueue the distance to the start port:
	var priority_queue = new PriorityQueue({ comparator: function(a, b) { return a.distance - b.distance; }});
	for (var i = 0; i < list1.length; i++) {
		priority_queue.queue({"distance":list1[i][0],"next_port":list1[i][1],"path":[list1[i][1]]});	
		// console.log("PUSH:");
		// console.log({"distance":list1[i][0],"next_port":list1[i][1],"path":[list1[i][1]]});
		list1[i][1].visited = true;
	}
	
	// Pop the closest Port off the priority queue
	for (var j = 0; j < arbitrary_depth_limit; j++) {
		if (priority_queue.length == 0) {
			break;
		}
		var next = priority_queue.dequeue();
		// console.log("POP:");
		// console.log(next);
		var distance = next.distance;
		var next_port = next.next_port;
		if (next_port instanceof Port) {
			for (var i = 0; i < next_port.edges.length; i++) {
				// console.log("EDGES: ", i);
				for (var k=0; k < list2.length; k++) {
					// console.log("k = ", k);
					if (next_port.edges[i].port == list2[k][1]) {
						var new_path = next.path.slice();
						new_path.push(next_port.edges[i].port.glide);
						priority_queue.queue({"distance":list2[k][0]+distance, "next_port":0, "path": new_path});
						// console.log("push:");
						// console.log({"distance":list2[k][0]+distance, "next_port":0, "path": new_path});
					}
				}
				if (next_port.edges[i].port.glide.visited != true) {
					var new_path = next.path.slice();
					new_path.push(next_port.edges[i].port.glide);
					priority_queue.queue({"distance":next_port.edges[i].port.node.length+distance,"next_port":next_port.edges[i].port.glide,"path":new_path});
					next_port.edges[i].port.glide.visited = true;
				}
			}
		} else {
			return {"distance":distance,"path":next.path};
		}
	}
	return null;
};


Graph.prototype.get_unvisited = function() {
	var unvisited_ports = [];
	for (var node_name in this.nodes) {
		var node = this.nodes[node_name];
		for (var port_name in this.nodes[node_name].ports) {
			var port = this.nodes[node_name].ports[port_name];
			if (port.visited == undefined || port.visited==false) {
				unvisited_ports.push(port);
			}
		}
	}
	return unvisited_ports;
};


////////////////////////  Basic traversal  ////////////////////////
Graph.prototype.df_traverse_from_port = function(this_port) {
	this_port.visited = true;
	this_port = this_port.glide;
	this_port.visited = true;
	for (var i = 0; i < this_port.edges.length; i++) {
		if (this_port.edges[i].port.visited != true) {
			this.df_traverse_from_port(this_port.edges[i].port);
		}
	}
}

Graph.prototype.df_traverse = function() {
	var unvisited = this.get_unvisited();
	while (unvisited.length > 0) {
		this.df_traverse_from_port(unvisited[0]);
		unvisited = this.get_unvisited();
	}
};

////////////////////////  Count connected components  ////////////////////////

Graph.prototype.count_connected_components = function() {
	var unvisited = this.get_unvisited();
	var num_connected_components = 0;
	while (unvisited.length > 0) {
		var this_port = unvisited[0];
		this.df_traverse_from_port(this_port);
		this.df_traverse_from_port(this_port.glide);
		num_connected_components++;
		unvisited = this.get_unvisited();
	}
	return num_connected_components;
};

Graph.prototype.binary_search = function(chrom,pos,i,j) {
	var mid = Math.round((i+j)/2);
	// console.log("pos=",pos,", i=", i, " j=",j,"mid=", mid);
	if (i == j) {
		return i;
	}
	if (Math.abs(j-i) == 1) {
		if (Math.abs(this.genomic_sorted_positions[chrom][i]-pos) < Math.abs(this.genomic_sorted_positions[chrom][j]-pos)) {
			return i; // pos is closer to element at index i
		} else {
			return j; // pos is closer to element at index j
		}
	}
	if (pos == this.genomic_sorted_positions[chrom][mid]) {
		return mid;
	}
	else if (pos > this.genomic_sorted_positions[chrom][mid]) {
		return this.binary_search(chrom,pos,mid,j);
	} else if (pos < this.genomic_sorted_positions[chrom][mid]) {
		return this.binary_search(chrom,pos,i,mid);
	}
}

Graph.prototype.nearby_port = function(chrom,pos,nearest_breakpoint) {
	var port = "s";
	if (pos == nearest_breakpoint) {
		if (this.genomic_node_lookup[[chrom,nearest_breakpoint,"s"]] == undefined) {
			port = "e";
		} else {
			port = "s";
		}
	} else if (pos > nearest_breakpoint) {
		port = "s";
	} else {
		port = "e";
	}
	var node_name = this.genomic_node_lookup[[chrom,nearest_breakpoint,port]];
	if (node_name == undefined) {
		console.log( "ERROR: genomic_node_lookup does not contain this combination of chrom,pos,strand)");
		console.log("Nearest breakpoint found was ",chrom, ":", nearest_breakpoint, ":", port);
		return null;
	}
	
	var relative_position = -1;
	if (port == "s") {
		relative_position = pos - nearest_breakpoint;
	} else {
		// console.log("node_length: ", this.nodes[node_name].length);
		// console.log("pos: ", pos);
		// console.log("nearest_breakpoint: ", nearest_breakpoint);
		relative_position = this.nodes[node_name].length - (nearest_breakpoint-pos)
	}

	return {"node_name":node_name, "port":port,"node_position":relative_position};
}

Graph.prototype.point_by_genomic_location = function(chrom,pos) {
	
	// using a dictionary by chromosome containing sorted lists of the breakpoint locations for binary searching
	if (this.genomic_sorted_positions.hasOwnProperty(chrom)) {
		var index = this.binary_search(chrom, pos, 0, this.genomic_sorted_positions[chrom].length);
		var nearest_breakpoint = this.genomic_sorted_positions[chrom][index];
		
		var relative_position = -1;
		
		var output = this.nearby_port(chrom,pos,nearest_breakpoint)
		
		var point = new Point(this.nodes[output.node_name], output.node_position);
		return point;
	
	} else {
		return null;
	}
}


Graph.prototype.port_list_by_interval = function(interval) {
	// where interval = {"name":"test1","chromosome":"1","start":50080,"end":50370};

	if (interval.start > interval.end) {
		var tmp = interval.end;
		interval.end = interval.start;
		interval.start = tmp;
	}

	if (this.genomic_sorted_positions.hasOwnProperty(interval.chromosome)) {
		var index1 = this.binary_search(interval.chromosome, interval.start, 0, this.genomic_sorted_positions[interval.chromosome].length);
		var index2 = this.binary_search(interval.chromosome, interval.end, 0, this.genomic_sorted_positions[interval.chromosome].length);
		


		var nearest_breakpoint1 = this.genomic_sorted_positions[interval.chromosome][index1];
		var output1 = this.nearby_port(interval.chromosome,interval.start,nearest_breakpoint1);

		var nearest_breakpoint2 = this.genomic_sorted_positions[interval.chromosome][index2];
		var output2 = this.nearby_port(interval.chromosome,interval.end,nearest_breakpoint2);
		
		var point1 = new Point(this.nodes[output1.node_name], output1.node_position);
		var point2 = new Point(this.nodes[output2.node_name], output2.node_position);


		var list = [
			[point1.distance["s"],point1.node.ports["s"]],
			[point2.distance["e"],point2.node.ports["e"]],
		];
		var used_breakpoints = [this.nodes[output1.node_name].genomic_coordinates.start,  this.nodes[output2.node_name].genomic_coordinates.end];
		
		var breakpoints = this.genomic_sorted_positions[interval.chromosome].slice(index1,index2+1);
		for (var i = 0; i < breakpoints.length; i++) {
			if (breakpoints[i] != used_breakpoints[0] && breakpoints[i] != used_breakpoints[1]) {
				list.push([0,this.nodes[this.genomic_node_lookup[[interval.chromosome,breakpoints[i],"s"]]].ports["s"]]);
				list.push([0,this.nodes[this.genomic_node_lookup[[interval.chromosome,breakpoints[i],"e"]]].ports["e"]]);
			}
		}
		return list;
	
	} else {
		return null;
	}
}

Graph.prototype.details_from_path = function(results) {
	var current_port = results.path[0];
	var output = results;
	output.edges = [];
	output.variant_names = [];
	for (var i = 1; i < output.path.length; i++) {
		// console.log(i);
		// console.log(output.path[i]);
		for (var j = 0; j < current_port.edges.length; j++) {
			// console.log("j = ", j);
			var item = current_port.edges[j];
			if (item.port.id == output.path[i].glide.id) {
				// console.log(item.port.id);
				// console.log(output.path[i].glide.id);
				output.edges.push(item.edge);
				if (item.edge.variant_name != null) {
					output.variant_names.push(item.edge.variant_name);
				}
			}
		}
		current_port = output.path[i];
	}

	return output;
}

Graph.prototype.gene_fusion = function(gene1,gene2) {
	// var gene1 = {"name":"test1","chromosome":"1","start":50080,"end":50370};
	// var gene2 = {"name":"test2","chromosome":"2","start":1340, "end":1010};

	if (gene1.name == undefined || gene2.name == undefined) {
		throw "Gene annotion does not have key: name";
		return null;
	}
	if (gene1.chromosome == undefined || gene2.chromosome == undefined) {
		throw "Gene annotion does not have key: chromosome";
		return null;
	}
	if (gene1.start == undefined || gene2.start == undefined) {
		throw "Gene annotion does not have key: start";
		return null;
	}
	if (gene1.end == undefined || gene2.end == undefined) {
		throw "Gene annotion does not have key: end";
		return null;
	}

	var list1 = this.port_list_by_interval(gene1);
	var list2 = this.port_list_by_interval(gene2);

	var results = this.bfs(list1,list2);
	
	var details = this.details_from_path(results);

	details.gene1 = gene1.name;
	details.gene2 = gene2.name;

	details.chrom1 = gene1.chromosome;
	details.chrom2 = gene2.chromosome;
	details.annotation1 = gene1;
	details.annotation2 = gene2;
	
	return details;
}




