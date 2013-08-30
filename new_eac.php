<?php
/*
  This script displays a form for creating a new EAC record.

  -- Jamie

*/

include('header.php');
?>
<form>
<select id="entity_type">
  <option>Person</option>
  <option>Corporate Body</option>
  <option>Family</option>
  </select>


  <label>Name</label>
  <input id="eac_name" type="text" autofocus required/>
  <label>Biography <span style="font-style:italic;">(please enter a space between each paragraph)</span></label>
  <textarea cols="60" style="margin-left:0; margin-bottom:1%;" id="bioghist" required></textarea>
  </form>

  <button id="submit_new" class="pure-button pure-button-primary">Create</button>

  <p id="results"></p>

  <script>

  $('#submit_new').click(function() {
      $('#results').html('');

      $.post("save_new.php", {

	type: $('#entity_type').val(),
	    name: $('#eac_name').val(),
	    entity: $('#entity_type').val(),
	    bioghist: $('#bioghist').val(),
      	 dir : <?php echo  '"' . addslashes($ead_path) . '"'; ?>

	    }, function (data) {

	  $('#results').html(data);

	});

    });

</script>

<?php
include('footer.php');
?>