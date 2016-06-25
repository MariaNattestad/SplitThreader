class Graph {
	constructor() {
		this.nodes = {};
		this.edges = {};
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

Graph.prototype.from_edge_list = function (input) {
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


////////////////////////  Motif detection  ////////////////////////

// Graph.prototype.count_tandem_repeats_from_port = function(this_port) {
// 	this_port.visited = true;
// 	this_port = this_port.glide;
// 	this_port.visited = true;
// 	for (var i = 0; i < this_port.edges.length; i++) {
// 		if (this_port.edges[i].port.visited != true) {
// 			this.df_traverse_from_port(this_port.edges[i].port);
// 		}
// 	}
// }


// Graph.prototype.count_tandem_repeats = function() {
// 	var unvisited = this.get_unvisited();
// 	while (unvisited.length > 0) {
// 		this.count_tandem_repeats_from_port(unvisited[0]);
// 		unvisited = this.get_unvisited();
// 	}
// }






