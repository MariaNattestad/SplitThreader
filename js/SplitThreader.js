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
		// this.edges = []; // list of objects with {id:id, node:node_id, port:s/e}
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
		this.spansplit = "";
	}
}

class Point {
	constructor(node,pos) {
		this.node = node;
		this.pos = pos;
		this.name = "";
		this.distance = {"s":pos,"e":node.length-pos};
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
		if (!positions_by_chrom.hasOwnProperty(variants[i].chrom1)) {
			positions_by_chrom[variants[i].chrom1] = [];
		}
		positions_by_chrom[variants[i].chrom1].push(variants[i].pos1);

		if (!positions_by_chrom.hasOwnProperty(variants[i].chrom2)) {
			positions_by_chrom[variants[i].chrom2] = [];
		}
		positions_by_chrom[variants[i].chrom2].push(variants[i].pos2);

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
		var v = variants[i];

		var port1 = strand_to_port(v.strand1);
		var node1 = this.genomic_node_lookup[[v.chrom1,v.pos1,port1]];

		var port2 = strand_to_port(v.strand2);
		var node2 = this.genomic_node_lookup[[v.chrom2,v.pos2,port2]];

		// Split and 2 spanning edges
		this.create_edge(edge_name_counter,     node1, port1, node2, port2); // split edge
		this.create_edge(edge_name_counter + 1, node1, port1, this.genomic_node_lookup[[v.chrom1,v.pos1,opposite_port(port1)]], opposite_port(port1)); // spanning edge for node 1
		this.create_edge(edge_name_counter + 2, this.genomic_node_lookup[[v.chrom2,v.pos2,opposite_port(port2)]], opposite_port(port2), node2, port2); // spanning edge for node 2 
		edge_name_counter += 3; 
	}
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

Graph.prototype.bfs = function(list1,list2) {
	arbitrary_depth_limit = 100;


	// Enqueue the distance to the start port:
	var priority_queue = new PriorityQueue({ comparator: function(a, b) { return a[0] - b[0]; }});
	for (var i = 0; i < list1.length; i++) {
		priority_queue.queue(list1[i]);	
	}
	// Pop the closest Port off the priority queue
	for (var j = 0; j < arbitrary_depth_limit; j++) {
		if (priority_queue.length == 0) {
			break;
		}
		var next = priority_queue.dequeue();
		var distance = next[0];
		var next_port = next[1];
		if (next_port instanceof Port) {
			for (var i = 0; i < next_port.edges.length; i++) {
				for (var k=0; k < list2.length; k++) {
					if (next_port.edges[i].port == list2[k][1]) {
						priority_queue.queue([list2[k][0]+distance, 0])	
					}
				}
				priority_queue.queue([next_port.edges[i].port.node.length+distance,next_port.edges[i].port.glide])
			}
		} else {
			return distance;
		}

	}
	return -1;
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

Graph.prototype.point_by_genomic_location = function(chrom,pos) {
	
	// using a dictionary by chromosome containing sorted lists of the breakpoint locations for binary searching
	if (this.genomic_sorted_positions.hasOwnProperty(chrom)) {
		var index = this.binary_search(chrom, pos, 0, this.genomic_sorted_positions[chrom].length)
		var nearest_breakpoint = this.genomic_sorted_positions[chrom][index];
		var port = "s";
		var relative_position = -1;
		
		if (pos == nearest_breakpoint) {
			if (this.genomic_node_lookup[[chrom,nearest_breakpoint,"s"]] == undefined) {
				port = "e";
			} else {
				port = "s";
			}
		}
		else if (pos > nearest_breakpoint) {
			port = "s";
		} else {
			port = "e";
		}

		var node_name = this.genomic_node_lookup[[chrom,nearest_breakpoint,port]];
		if (node_name == undefined) {
			console.log( "ERROR: genomic_node_lookup does not contain this combination of chrom,pos,strand)");
			return null;
		}

		if (port == "s") {
			relative_position = pos - nearest_breakpoint;
		} else {
			relative_position = this.nodes[node_name].length - (nearest_breakpoint-pos)
		}
		var point = new Point(node_name, relative_position);
		return point;
	
	} else {
		return null;
	}
}



















