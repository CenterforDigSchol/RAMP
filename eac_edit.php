<?php
/* 
   This script creates the select box listing of files that are used in the editing interface and outputs all the markup required for running the Ace editor on the page.

   -- Jamie

*/

include('header.php');
?>


<script src="script/editor.js"></script>
  <script src="script/eac_editor.js"></script>
  <script src="script/vkbeautify.js"></script>
  <script src="script/ingest.js"></script>
  <script src="script/wikiator.js"></script>
 

  <div id="edit_controls">
 <h1 id="entity_name"></h1>
  
 <?php

$mysqli = new mysqli($db_host, $db_user, $db_pass, $db_default, $db_port);
if ($mysqli->connect_errno) {
  echo "Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error;
}



$results = $mysqli->query ("SELECT ead_file, ExtractValue(eac_xml, '/descendant-or-self::part[1]') AS 'Name', substring_index(ead_file, '/', -1) AS 'SortHelp'
							FROM ead_eac.eac
							ORDER BY CASE WHEN Name = '' THEN SortHelp ELSE Name END ASC");



echo  "<select id='ead_files' class='ead_files'>";

echo "<option>Edit a different record</option>";

echo "<option value=''></option>";

while ($row = $results->fetch_assoc()) {
  $name = $row["Name"];
  $file_name = $row["ead_file"];
  $file_name_display = htmlentities(basename($file_name));
  if($row["Name"]) {

    print "<option value='$file_name'>$name</option>";

  } else {

    print "<option value='$file_name'>$file_name_display</option>";

  }

}



//	foreach ($files as $file) {

print ("<option>");

//		print ("</option>");


print ("</select>");


?>

  <span id="ingest_buttons">


  <button id="ingest_viaf" class="ingest_button pure-button pure-button-primary" >Ingest VIAF</button>
 

  <button id="ingest_worldcat" class="ingest_button pure-button pure-button-primary" >Ingest WorldCat</button>  

  </span>

<button id="save_eac" class="pure-button pure-button-primary">Save XML</button>

  <button id="convert_to_wiki" class="pure-button pure-button-primary">Convert to Wiki Markup </button>
  
  </div>
 
  <div id="validation">
  </div>
  <div id="validation_text">
  </div>
  </div>
  
  <div id="editor_mask">
  <div id="editor_container">


  <div id="editor"></div>
  </div>
  </div>

  <script src="script/ace/ace.js" type="text/javascript" charset="utf-8"></script>

  <script>
  var editor = ace.edit("editor");
editor.getSession().setMode("ace/mode/xml");
</script>

<link rel="stylesheet" type="text/css" href="script/select2.css"/>
  <script src="script/select2/select2.min.js"></script>

  <script>
  //   $(document).ready(function() { $("#ead_files").select2(); });
  </script>
  <?php


  include('footer.php');

?>
