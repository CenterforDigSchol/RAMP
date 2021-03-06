<?php
include('header.php');
use RAMP\Util\Uploader;
use RAMP\XML\EadConvert;
use RAMP\Util\Database;

require_once('autoloader.php');
require_once('conf/includes.php');

?>
<script src="script/import_ead.js"></script>
<?php
if(isset($_FILES['ead'])){

    $ead_convert = new EadConvert('none');
    $ead_convert->setAgency_code($agency_code);
    $ead_convert->setOther_agency_code($other_agency_code);
    $ead_convert->setAgency_name($agency_name);
    $ead_convert->setShortAgency_name($short_agency_name);
    $ead_convert->setServer_name($serverName);
    $ead_convert->setLocal_url($localURL);
    $ead_convert->setRepository_one($repositoryOne);
    $ead_convert->setRepository_two($repositoryTwo);
    $ead_convert->setEventDescDerive($eventDescDerive);
    $ead_convert->setEventDescRevise($eventDescRevise);
    $ead_convert->setEventDescCreate($eventDescCreate);
    $ead_convert->setEventDescExport($eventDescExport);


    $u = new Uploader($_FILES, $ead_convert);

    $response = $u->getResponse();
//now convert eac xml to wiki markup and then insert it into db
    $db = Database::getInstance();
    $mysqli = $db->getConnection();

    $last_id = $u->getLastInsertId();

    $eac_xml_query = $mysqli->query("SELECT eac_xml FROM eac WHERE eac_id = '$last_id'");

    $eac_xml_result = $eac_xml_query->fetch_row();

    $eac_xml = $eac_xml_result['0'];

//transform xml to wiki markup
    $dom = new \DOMDocument();
    $dom->loadXML($eac_xml);

//Start the XSLT transfrom
    $xsltProcessor = new \XSLTProcessor();
    $xsl = new \DOMDocument();

// Load the stylesheet

    $xsl->load('../xsl/eac2wiki.xsl');
    $xsltProcessor->importStylesheet($xsl);


// Get the result
    $xslt_result = $xsltProcessor->transformToXml($dom);
    $xslt_result = str_replace("        ", "", $xslt_result);


    $media_wiki = mysqli_real_escape_string($mysqli,$xslt_result);


    $sql = "INSERT INTO mediawiki (wiki_text, eac_id) VALUES ('$media_wiki', '$last_id') ON DUPLICATE KEY UPDATE wiki_text = '$media_wiki'";

    $result = $mysqli->query($sql);
    if (!$result) {
        //printf("%s\n", $mysqli->error);
        //echo $sql;
        $flash_message = "<div id=\"flash_message\"><div class=\"error-message\">";

        if(isset($response) && ($response == "\"XML is not valid. Please check the xml file for errors.\"")) {
            $flash_message .=  "<p>". $response ."</p>";
        }
        $flash_message .= "<p>Error, your EAD file has not been uploaded.</p>";
        $flash_message .= "</div></div>";

    } else {
        $flash_message = "<div id=\"flash_message\"><div class=\"success-message\"><p>Success! Your file(s) has been uploaded/imported. Click <a href='/index.php'> here</a> to return to the Homepage and start working on the file.</p></div></div>";

    }

}
?>



    <div class="recordtitle-bkg">    
       <div class="recordtitle">
            <div class="inner-area"><h2 class="page-top-heading">Upload/Import Files</h2></div>
       </div>
    </div>

    <div class="decoration-bar">
        <div class="pure-g">
            <div class="pure-u-1-4 decor1"></div>
            <div class="pure-u-1-4 decor2"></div>
            <div class="pure-u-1-4 decor3"></div>
            <div class="pure-u-1-4 decor4"></div>
        </div>
    </div>

    <div class="inner-area">
        <p id="convert_message">On this page users can either <strong>Upload</strong> EAD/EAC-CPF files or <strong>Import</strong> the ones that were placed in the "ead" folder during the install process. During the Upload/Import process, EAD files are automatically converted to EAC-CPF and can be downloaded <a href="all-items.php">here</a>.</p>


        <div class="pure-g conversion-area">
            <div class="pure-u-1 pure-u-md-1-2">                
                <h3>Upload a File</h3>
                <form enctype="multipart/form-data" method="POST" class="pure-form">
                    <input type="hidden" name="MAX_FILE_SIZE" value="30000000"/>
                    <input name="ead" type="file"/><br>
                    <input disabled type="submit" class="pure-button ramp-button action-button" value="Upload"/>
                </form>                
            </div>
            
            <div class="pure-u-1 pure-u-md-1-2">
                <h3>Import from EAD Folder</h3>
                <form action="ead_convert_class.php">

                    <input type="hidden" name='dir' value="<?php echo $ead_path ?>"></input>
                    <button type="button" id="convertEad2Eac" name="convertEad2Eac"
                            class="ramp-button pure-button action-button">Import
                    </button>
                    <span id="file_estimator" style="display: none;"></span>
                    <div id="results"></div>
                </form>
            </div>


        </div> <!-- end pure-g -->


        <?php if(isset($flash_message)) {
            echo $flash_message;
        } ?>
    </div>

<?php include('footer.php'); ?>

<script>
    $('input[name="ead"]').on('click', function() {


        $('input[type="submit"]').prop('disabled', false);
    })

</script>
