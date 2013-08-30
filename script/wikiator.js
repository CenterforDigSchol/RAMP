//global variables
var mstrTitle = '';
var mboolIsNew = false;

jQuery(document).ready(function($)
{
	//register click event to login to wiki
	$("#wiki_login").on("click", setupWikiLogin );
	//register click event to logout to wiki
	$("#wiki_logout").on("click", setupWikiLogout );
});

/*
* setupWikiLogin displays a form for the editor to login to wikipedia
* @method setupWikiLogin
*/
function setupWikiLogin()
{
	$('body').append("<div id=\"dialog-form\" title=\"Wiki Login\"> \
					<p class=\"validate-prompt\">Cannot be blank!</p> \
					<form> \
						<fieldset> \
							<label for=\"username\">Username</label> \
						<input type=\"input\" name=\"username\" id=\"username\" class=\"text ui-widget-content ui-corner-all\" value=\"\"/> \
						</fieldset> \
						<fieldset> \
							<label for=\"password\">Password</label> \
						<input type=\"password\" name=\"password\" id=\"password\" class=\"text ui-widget-content ui-corner-all\" value=\"\"/> \
						</fieldset> \
					</form></div>");

	//display login form
	makePromptDialog('#dialog-form', 'Wiki Login?', function(dialog)
		{
			var lstrUserName = $('input[name="username"]').val();
			var lstrPassword = $('input[name="password"]').val();

			$(dialog).dialog("close");
            $(dialog).remove();

            //post to ajax wiki controller to log into wiki and get whether successful or not
			$.post('ajax/wiki_api.php', { 'action' : 'login', 'username' : lstrUserName, 'password' : lstrPassword }, function(response)
			{
				if( response.toLowerCase().indexOf("success") != -1)
				{
					$('#wiki_login').replaceWith("<li id=\"wiki_logout\" class=\"wiki_login menu_slice\"><a href=\"#\">Wiki Logout</a></li>");
					$("#wiki_logout").on("click", setupWikiLogout );
				}				

				$('body').append("<div id=\"dialog\"><p>" + response + "</p></div>");
				makeDialog('#dialog');
				
				return;
			});
		});
}

/*
* setupWikiLogout logouts of wiki and deletes cookie that states user is logged in
* @method setupWikiLogout
*/
function setupWikiLogout()
{
	//post to ajax wiki controller to log out of wiki and get whether successful or not
	$.post('ajax/wiki_api.php', { 'action' : 'logout' }, function(response)
	{
		//delete cookie that states user is logged in
		deleteCookie('ramp_wiki_li');

		$('#wiki_logout').replaceWith("<li id=\"wiki_login\" class=\"wiki_login menu_slice\"><a href=\"#\">Wiki Login</a></li>");
		$("#wiki_login").on("click", setupWikiLogin );

		$('body').append("<div id=\"dialog\"><p>" + response + "</p></div>");
		makeDialog('#dialog');
	});
}

/*
* setupGetWiki setup click event to search wiki
* @method setupGetWiki
*/
function setupGetWiki()
{
	jQuery('#get_wiki').on('click', function()
	{
		$('#get_wiki').hide();
		$('#get_wiki').after('<img id="loading-image" src="style/images/loading.gif" alt="loading" style="float: right;"/>');

		var lstrXML = editor.getValue();

		//xml must exist to continue
		if( lstrXML == '' )
		{
			$('body').append("<div id=\"dialog\"><p>Cannot read XML!</p></div>");
			makeDialog('#dialog', 'Error!');

			//alert("Cannot read XML!");
			$('#loading-image').remove();
			$('#get_wiki').show();
			return;
		}

		//xml must be valid to continue
		validateXML(function(lboolValid){

			if(lboolValid)
			{
				var lobjeac = new eac();
				lobjeac.loadXMLString( lstrXML );

				var lobjNameEntryPart = lobjeac.getElement('//*[local-name()=\'cpfDescription\']/*[local-name()=\'identity\']/*[local-name()=\'nameEntry\']/*[local-name()=\'part\']');
				eac_name = lobjNameEntryPart.childNodes[0].nodeValue;
				eac_name = eac_name.trim();
				eac_name = encode_utf8(eac_name);

				searchWiki(eac_name);
			}else
			{
				$('body').append("<div id=\"dialog\"><p>XML must be valid!</p></div>");
				makeDialog('#dialog', 'Error!');

				//alert("XML must be valid!");
				$('#loading-image').remove();
				$('#get_wiki').show();
			}
		});
	});
}

/*
* searchWiki search wikipedia with passed search string and display results
* @method searchWiki
*/
function searchWiki( lstrSearch )
{
	$('body').append("<div id=\"dialog-form\" title=\"Wiki Search\"> \
					<p class=\"validate-prompt\">Cannot be blank!</p> \
					<form> \
						<fieldset> \
							<label for=\"search\">Search</label> \
						<input type=\"text\" name=\"search\" id=\"search\" class=\"text ui-widget-content ui-corner-all\" value=\"" + decode_utf8(lstrSearch) + "\"/> \
					</fieldset> \
				</form></div>");

	$('#loading-image').remove();
	$('#get_wiki').show();

	//propt user to enter search string for wiki search
	makePromptDialog('#dialog-form', 'Wiki Search?', function(dialog)
		{
			var lstrUserSearch = $('input[name="search"]').val();

        	if(lstrUserSearch == '')
        	{
        		$('.validate-prompt').show();
        	}
        	else
        	{
        		$('#get_wiki').hide();
				$('#get_wiki').after('<img id="loading-image" src="style/images/loading.gif" alt="loading" style="float: right;"/>');

        		lstrUserSearch = encode_utf8(lstrUserSearch);

        		$(dialog).dialog("close");
	            $(dialog).remove();

	            //post to ajax wiki controller to search wiki and get results
				$.post('ajax/wiki_api.php', { 'action' : 'search', 'title' : lstrUserSearch }, function(response)
				{
					try
					{
						var lobjData = JSON.parse(response);
					}
					catch(e)
					{
						$('body').append("<div id=\"dialog\"><p>" + response + "</p></div>");
						makeDialog('#dialog');
						
						//alert(response);
						$('#loading-image').remove();
						$('#get_wiki').show();

						return;
					}

					//display wiki results in form for editor to chose
					displayWikiSearch(lobjData, function( lstrChosenTitle )
					{
						//get wiki markup of chosen results
						getWiki(lstrChosenTitle);
					});
				});
        	}
		});
}

/*
* displayWikiSearch display wiki search results for editor to chose
* @method displayWikiSearch
*/
function displayWikiSearch( lobjTitles, callback )
{
	var lstrHTML = "<div class=\"form_container\" style=\"top: 50px;\"><div class=\"user_help_form\">";

	lstrHTML += "<h3>Please Choose Title: <div class=\"form_note\">*Wikipedia&#39;s search index is updated every morning. New pages will take a day to show up in index.</div></h3>";

	for(var i = 0; i < lobjTitles.length; i++)
	{
		lstrHTML += "<input type=\"radio\" name=\"chosen_title\" value=\"";
		lstrHTML += lobjTitles[i].title + "\" /> " + lobjTitles[i]['title'] + "<br />" + html_decode(lobjTitles[i]['snippet']) + "<br /><br />";
	}

	lstrHTML += "<button id=\"get_chosen_wiki\" class=\"pure-button pure-button-secondary\">Use Selected Title</button>";
	lstrHTML += "<button id=\"get_chosen_wiki_no_match\" class=\"pure-button pure-button-secondary\">No Match (create new)</button>";
	lstrHTML += "</div></div>";

	$('body').append(lstrHTML);
	jQuery('html,body').animate({scrollTop:0},0); //scroll to top to view form correctly

	//register click event to continue process once user choses result
	$('#get_chosen_wiki').on('click', function()
	{

		if( typeof $('input[name="chosen_title"]:checked').val() == 'undefined' )
		{
			$('body').append("<div id=\"dialog\"><p>Must choose one!</p></div>");
			makeDialog('#dialog', 'Error!');

			//alert('Must choose one!');
			return;
		}

		callback($('input[name="chosen_title"]:checked').val());

		$('.form_container').remove();
	});

	//register click event to cancel process
	$('#get_chosen_wiki_no_match').on('click', function()
	{
		callback('!new_wiki_page!');

		$('.form_container').remove();
	});
}

/*
* getWiki display get wikimarkup from wiki api with passed title
* @method getWiki
*/
function getWiki( lstrTitle )
{
	//initialize title so every time new user gets wiki page, new title is saved
	mstrTitle = '';

	//if editor does not see any desired wiki results, append blank textarea and status is new wiki page
	if( lstrTitle == '!new_wiki_page!' )
	{
		mboolIsNew = true;

		$('#wikieditor').append("<div class=\"wiki_container\" style=\"width: auto; height: 100%\"> \
			<button id=\"gtselectedtext\" class=\"pure-button pure-button-secondary\">&gt;</button><br /> \
			<button id=\"ltselectedtext\" class=\"pure-button pure-button-secondary\">&lt;</button></div> \
			<div class=\"wiki_container\"><textarea id=\"get_wiki_text\"></textarea></div>");
		$('#get_wiki_text').height($('#wikimarkup').height());

		$('#loading-image').remove();
		$('#get_wiki').replaceWith('<button id="post_wiki" class=\"pure-button pure-button-primary\">Post Wiki</button>');
		$('#post_wiki').after('<span id="draft_container"><input id="chkbx_draft" type="checkbox" />&nbsp;Draft</span>');

		setupPostWiki();
	}else
	{
		mstrTitle = lstrTitle;

		//post to ajax wiki controller to get wiki markup with posted title
		$.post('ajax/wiki_api.php', { 'action' : 'get', 'title' : lstrTitle }, function(response)
		{
			$('#wikieditor').append("<div class=\"wiki_container\" style=\"width: auto\"> \
				<button id=\"gtselectedtext\" class=\"pure-button pure-button-secondary\">&gt;</button><br /> \
				<button id=\"ltselectedtext\" class=\"pure-button pure-button-secondary\">&lt;</button></div> \
				<div class=\"wiki_container\"><textarea id=\"get_wiki_text\">" + response + "</textarea></div>");
			$('#get_wiki_text').height($('#wikimarkup').height());

			$('#loading-image').remove();
			$('#get_wiki').replaceWith('<button id="post_wiki" class=\"pure-button pure-button-primary\">Post Wiki</button>');
			$('#post_wiki').after('<span id="draft_container"><input id="chkbx_draft" type="checkbox" />&nbsp;Draft</span>');

			setupPostWiki();
		});
	}
}

/*
* setupPostWiki register click event to post edit to wiki
* @method setupPostWiki
*/
function setupPostWiki()
{
	$('#post_wiki').on('click', function()
	{
		//if user is not logged in, notify user and cancel posting process
		if( getCookie('ramp_wiki_li') == null || getCookie('ramp_wiki_li') != '1' )
		{
			$('body').append("<div id=\"dialog\"><p>Need to log in before posting to Wikipedia.</p></div>");
			makeDialog('#dialog');
		}else
		{
			if( mstrTitle == '' )
			{
				$('body').append("<div id=\"dialog-form\" title=\"Wiki Title\"> \
						<p class=\"validate-prompt\">Cannot be blank!</p> \
						<form> \
							<fieldset> \
								<label for=\"title\">Title</label> \
							<input type=\"text\" name=\"title\" id=\"title\" class=\"text ui-widget-content ui-corner-all\" value=\"" + decode_utf8(eac_name) + "\"/> \
						</fieldset> \
					</form></div>");

				//get wiki page title from editor if new wiki page
				makePromptDialog('#dialog-form', 'Wiki Title?', function(dialog)
					{
						var lstrTitle = $('input[name="title"]').val();

		            	if(lstrTitle == '')
		            	{
		            		$('.validate-prompt').show();
		            	}
		            	else
		            	{
		            		$(dialog).dialog("close");
		                	$(dialog).remove();

		            		mstrTitle = lstrTitle;

		            		getUserComments();
		            	}
					});

				//mstrTitle = prompt("Please enter title of new Wiki page:");
			}else
			{
				getUserComments();
			}
		}
	});

	//setup functionality to select and push text between converted wikimarkup and wikimarkup editor wants to post to wiki

	//register select event to save selected text in textareas
	$('.wiki_container textarea').select(function()
	{
		selectedtext = getSelection( $(this).attr('id') );
	});

	//register click event to pass last selected text to right textarea
	$('#gtselectedtext').on('click', function()
	{
		//alert(selectedtext);

		$('#get_wiki_text').insertAtCaret(selectedtext);
	});

	//register click event to pass last selected text to left textarea
	$('#ltselectedtext').on('click', function()
	{
		//alert(selectedtext);

		$('#wikimarkup').insertAtCaret(selectedtext);
	});
}

/*
* getUserComments prompt user for comments for editing wiki page
* @method getUserComments
*/
function getUserComments()
{
	$('body').append("<div id=\"dialog-form\" title=\"Wiki Comments\"> \
			<p class=\"validate-prompt\">Cannot be blank!</p> \
			<form> \
				<fieldset> \
					<label for=\"title\">Comments</label> \
				<input name=\"comments\" id=\"comments\" size=\"50\" maxlength=\"255\" /> \
			</fieldset> \
		</form></div>");

	makePromptDialog('#dialog-form', 'Wiki Comment?', function(dialog)
	{
		var lstrComments = $('input[name="comments"]').val();

    	if(lstrComments == '')
    	{
    		$('.validate-prompt').show();
    	}
    	else
    	{
    		$(dialog).dialog("close");
	        $(dialog).remove();

			var lstrWiki = $('#get_wiki_text').val();
			postWiki( lstrWiki, lstrComments );
		}
	});
}

/*
* postWiki post to wiki api to edit wiki page with wiki markup.
* @method postWiki
*/
function postWiki( lstrWiki, lstrComments, lstrCaptchaAnswer, lstrCaptchaId )
{
	$('#post_wiki').after('<img id="loading-image" src="style/images/loading.gif" alt="loading" style="float: right;"/>');
	$('#post_wiki').hide();
	$('#draft_container').hide();

	var lboolDraft = false;

	if( $("#chkbx_draft").prop("checked") == true )
	{
		lboolDraft = true;
	}

	//if captcha not necessary, do not post captcha
	if( typeof lstrCaptchaId == 'undefined')
	{
		//post to ajax wiki controller to edit posted wiki page title with posted wiki markup
		$.post('ajax/wiki_api.php', { 'action' : 'post', 'title' : mstrTitle, 'isNew' : mboolIsNew, 'wiki' : lstrWiki, 'comments' : lstrComments,
			'isDraft' : lboolDraft },
			function(response)
		{
			try
			{
				var lobjData = JSON.parse(response);
			}
			catch(e) //in this case, if response is JSON, Captcha is needed to complete edit request
			{
				$('body').append("<div id=\"dialog\"><p>" + response + "</p></div>");
				makeDialog('#dialog');
				
				$('#loading-image').remove();
				$('#post_wiki').show();
				$('#draft_container').show();
				return;
			}

			//displays captcha question
			displayCaptcha( "http://en.wikipedia.org/" + lobjData.url, lobjData.id );
		});	
	}else
	{
		//post to ajax wiki controller to edit posted wiki page title with posted wiki markup and captcha answer
		$.post('ajax/wiki_api.php', { 'action' : 'post', 'title' : mstrTitle, 'isNew' : mboolIsNew, 
			'wiki' : lstrWiki,  'comments' : lstrComments, 'isDraft' : lboolDraft, 
			'captcha_ans' : lstrCaptchaAnswer, 'captcha_id' : lstrCaptchaId }, 
			function(response)
		{
			try
			{
				var lobjData = JSON.parse(response);
			}
			catch(e) //in this case, if response is JSON, Captcha is needed to complete edit request
			{
				$('body').append("<div id=\"dialog\"><p>" + response + "</p></div>");
				makeDialog('#dialog');

				$('#loading-image').remove();
				$('#post_wiki').show();
				$('#draft_container').show();
				return;
			}

			//displays captcha question 
			displayCaptcha( "http://en.wikipedia.org/" + lobjData.url, lobjData.id );
		});	
	}	
}

/*
* displayCaptcha display form with captcha image in order for editor to answer captcha question to complete edit wiki action
* @method displayCaptcha
*/
function displayCaptcha( lstrUrl, lstrCaptchaId )
{
	var lstrHTML = "<div class=\"form_container\" style=\"top: 50px;\"><div class=\"user_help_form\">";

	lstrHTML += "<h3>Please Solve CAPTCHA</h3>";
	lstrHTML += "<img src=\"" + lstrUrl +"\" /><br/>";
	lstrHTML += "<input name=\"captcha_ans\" type=\"text\"/><br/>";
	lstrHTML += "<button id=\"try_with_captcha\" class=\"pure-button pure-button-secondary\">Try again</button>";
	lstrHTML += "</div></div>";

	$('body').append(lstrHTML);
	jQuery('html,body').animate({scrollTop:0},0); //scroll to top to display form correctly

	//register click event to continue process once user answers captcha question
	$('#try_with_captcha').on('click', function()
	{
		var lstrWiki = $('#get_wiki_text').val();
		var lstrCaptchaAnswer = $('input[name="captcha_ans"]').val();

		postWiki( lstrWiki, lstrCaptchaAnswer, lstrCaptchaId );

		$('.form_container').remove();
	});
}

/*
* getSelection based on passed id, gets currently selected text
* @method getSelection
*/
function getSelection( lstrid )
{
  var textComponent = document.getElementById(lstrid);
  var selectedText;
  // IE version
  if (document.selection != undefined)
  {
    textComponent.focus();
    var sel = document.selection.createRange();
    selectedText = sel.text;
  }
  // Mozilla version
  else if (textComponent.selectionStart != undefined)
  {
    var startPos = textComponent.selectionStart;
    var endPos = textComponent.selectionEnd;
    selectedText = textComponent.value.substring(startPos, endPos)
  }
  return selectedText;
}

/*
* insertAtCaret extends Jquery extension to insert text to elements caret focus
* @method insertAtCaret
*/
jQuery.fn.extend({
    insertAtCaret: function(valueToInsertAtCaret){
        return this.each( function(i) {
            if ( document.selection ) {
                this.focus();
                selection = document.selection.createRange();
                selection.text = valueToInsertAtCaret;
                this.focus();
            } else if ( this.selectionStart || this.selectionStart == "0" ) {
                var startPosition = this.selectionStart;
                var endPosition = this.selectionEnd;
                var scrollTop = this.scrollTop;
                this.value = this.value.substring(0, startPosition) + valueToInsertAtCaret + this.value.substring(endPosition, this.value.length);
                this.focus();
                this.selectionStart = startPosition + valueToInsertAtCaret.length;
                this.selectionEnd = startPosition + valueToInsertAtCaret.length;
                this.scrollTop = scrollTop;
            } else {
                this.value += valueToInsertAtCaret;
                this.focus();
            }
        })
    }
});