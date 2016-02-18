$(document).ready(function () {

    selectFileToIngest();

    //clear ingest instructions after any module button is clicked
    clearInitialIngestInstructions();


    function selectFileToIngest() {

        $('.ead_files').change(function () {

            //set record object
            record.eadFile = this.value;
            record.entityName = $(this).children("option:selected").text();
            record.savedXml = "";
            record.wikiConversion = "";
            record.eacId = $(this).children("option:selected").data().id;

            //set the page header with name of person/file
            $('#record_entityName_header').text(record.entityName);

            //build the ace editor
            build_editor(record.eacId);


        });

    }


    function clearInitialIngestInstructions() {
        $('#ingest_buttons > button').on('click', function() {
            $('#controls_panel_instructions').remove();
        })
    }



    function getIngestStatus(record_id) {

        var eac_id = record_id;
        var url = 'ajax/get_ingest_status.php';

        $.ajax({
            url: url,
            data: {eac_id : eac_id},
            success: function(response){
                console.log(response);
                return response;
            },
            dataType: "json"
        });
    }



});