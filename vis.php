<!DOCTYPE html>

<html>


<!--    NAVIGATION BAR-->
<?php include "header.html";?>

<link href="css/splitthreader_visualizer.css" rel="stylesheet">

<div id="svg_landing"></div>

<div id="right_panel">

	<div id="label_gene_box" class="panel_box">
		<input id="search_input" class="search_field" type="text" placeholder="Find gene">
		<div class="livesearch"></div>
		<div>
		   <ul id="genes_labeled"></ul>
		</div>
	</div>


	<div id="gene_fusion_box" class="panel_box">
		<h4>Gene fusions</h4>
		<div id="fusion_gene1_box" class="gene_search_box">
			<input class="search_field" type="text" placeholder="Gene 1">
			<div class="livesearch"></div>
		</div>
		<div id="fusion_gene2_box" class="gene_search_box">
			<input class="search_field" type="text" placeholder="Gene 2">
			<div class="livesearch"></div>
		</div>

		<table id="gene_fusion_table">
			<tr id="input_row">
				<td width="20%" id="gene1"></td>
				<td width="20%" id="gene2"></td>
				<td width="60%"> <button id="submit_fusion">Submit</button></td>
			</tr>
		</table>
		<table id="gene_fusion_table_results">
			
		</table>

	</div>
	<div id="user_message" class="alert alert-default" role="alert"></div>

</div>





<script src="js/lib/d3.v3.min.js"></script>
<script src="js/lib/d3.tip.v0.6.3.js"></script>
<script src="js/lib/jquery.min.js"></script>
<script src="js/lib/bootstrap.min.js"></script>
<script src="js/lib/priority-queue.min.js"></script>

<script src="js/SplitThreader.js"></script>
<script src="js/SplitThreader_visualizer.js"></script>





