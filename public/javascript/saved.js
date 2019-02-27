/* global bootbox */
$(document).ready(function() {
	// Setting a reference to the article-container div where all the dynamic content will go
	// Adding event listeners to any dynamically generated "save article"
	// and "scrape new article" buttons
	var articleContainer = $('.article-container');
	$(document).on('click', '.btn.delete', removeFromSaved);
	$(document).on('click', '.btn.notes', handleNotes);
	$(document).on('click', '.btn.save', handleNoteSave);
	$(document).on('click', '.btn.note-delete', handleNoteDelete);

	$('.clear').on('click', handleArticleClear);
	console.log('hello world');
	function initPage() {
		// Run an AJAX request for any unsaved headlines
		$.get('/articles?saved=true').then(function(data) {
			articleContainer.empty();
			// If we have headlines, render them to the page
			if (data && data.length) {
				renderArticles(data);
			} else {
				// Otherwise render a message explaining we have no articles
				renderEmpty();
			}
		});
	}

	function handleNotes(event) {
		// This function handles opening the notes modal and displaying our notes
		// We grab the id of the article to get notes for from the card element the delete button sits inside
		var currentArticle = $(this).parents('.card').data();
		// Grab any notes with this headline/article id
		$.get('/api/notes/' + currentArticle._id).then(function(data) {
			// Constructing our initial HTML to add to the notes modal
			var modalText = $("<div class='container-fluid text-center'>").append(
				$('<h4>').text('Notes For Article: ' + currentArticle._id),
				$('<hr>'),
				$("<ul class='list-group note-container'>"),
				$("<textarea placeholder='New Note' rows='4' cols='60'>"),
				$("<button class='btn btn-success save'>Save Note</button>")
			);
			// Adding the formatted HTML to the note modal
			bootbox.dialog({
				message: modalText,
				closeButton: true
			});
			var noteData = {
				_id: currentArticle._id,
				notes: data || []
			};
			// Adding some information about the article and article notes to the save button for easy access
			// When trying to add a new note
			$('.btn.save').data('article', noteData);
			// renderNotesList will populate the actual note HTML inside of the modal we just created/opened
			renderNotesList(noteData);
		});
	}

	function handleNoteSave() {
		// This function handles what happens when a user tries to save a new note for an article
		// Setting a variable to hold some formatted data about our note,
		// grabbing the note typed into the input box
		var noteData;
		var newNote = $('.bootbox-body textarea').val().trim();
		// If we actually have data typed into the note input field, format it
		// and post it to the "/api/notes" route and send the formatted noteData as well
		if (newNote) {
			noteData = { _headlineId: $(this).data('article')._id, noteText: newNote };
			$.post('/api/notes', noteData).then(function() {
				// When complete, close the modal
				bootbox.hideAll();
			});
		}
	}

	function handleNoteDelete() {
		// This function handles the deletion of notes
		// First we grab the id of the note we want to delete
		// We stored this data on the delete button when we created it
		var noteToDelete = $(this).data('_id');
		// Perform an DELETE request to "/api/notes/" with the id of the note we're deleting as a parameter
		$.ajax({
			url: '/api/notes/' + noteToDelete,
			method: 'DELETE'
		}).then(function() {
			// When done, hide the modal
			bootbox.hideAll();
		});
	}

	function renderNotesList(data) {
		// This function handles rendering note list items to our notes modal
		// Setting up an array of notes to render after finished
		// Also setting up a currentNote variable to temporarily store each note
		var notesToRender = [];
		var currentNote;
		if (!data.notes.length) {
			// If we have no notes, just display a message explaining this
			currentNote = $("<li class='list-group-item'>No notes for this article yet.</li>");
			notesToRender.push(currentNote);
		} else {
			// If we do have notes, go through each one
			for (var i = 0; i < data.notes.length; i++) {
				// Constructs an li element to contain our noteText and a delete button
				currentNote = $("<li class='list-group-item note'>")
					.text(data.notes[i].noteText)
					.append($("<button class='btn btn-danger note-delete'>x</button>"));
				// Store the note id on the delete button for easy access when trying to delete
				currentNote.children('button').data('_id', data.notes[i]._id);
				// Adding our currentNote to the notesToRender array
				notesToRender.push(currentNote);
			}
		}
		// Now append the notesToRender to the note-container inside the note modal
		$('.note-container').append(notesToRender);
	}

	function renderArticles(articles) {
		// This function handles appending HTML containing our article data to the page
		// We are passed an array of JSON containing all available articles in our database
		var articleCards = [];
		// We pass each article JSON object to the createCard function which returns a bootstrap
		// card with our article data inside
		for (var i = 0; i < articles.length; i++) {
			articleCards.push(createCard(articles[i]));
		}
		// Once we have all of the HTML for the articles stored in our articleCards array,
		// append them to the articleCards container
		articleContainer.append(articleCards);
	}

	function createCard(article) {
		// This function takes in a single JSON object for an article/headline
		// It constructs a jQuery element containing all of the formatted HTML for the
		// article card
		console.log(article);
		var card = $("<div class='card'>");
		var cardHeader = $("<div class='card-header'>").append(
			$('<h3>').append(
				$("<a class='article-link' target='_blank' rel='noopener noreferrer'>")
					.attr('href', article.url)
					.text(article.headline),
				$('<a class="btn btn-danger delete">Delete From Saved</a>'),
				$('<a class="btn btn-info notes">Article Notes</a>')
			)
		);

		var cardBody = $("<div class='card-body'>").text(article.summary);

		card.append(cardHeader, cardBody);
		// We attach the article's id to the jQuery element
		// We will use this when trying to figure out which article the user wants to save
		card.data('_id', article._id);
		// We return the constructed card jQuery element
		return card;
	}

	function renderEmpty() {
		// This function renders some HTML to the page explaining we don't have any articles to view
		// Using a joined array of HTML string data because it's easier to read/change than a concatenated string
		var emptyAlert = $(
			[
				"<div class='alert alert-warning text-center'>",
				"<h4>Uh Oh. Looks like we don't have any new articles.</h4>",
				'</div>',
				"<div class='card'>",
				"<div class='card-header text-center'>",
				'<h3>What Would You Like To Do?</h3>',
				'</div>',
				"<div class='card-body text-center'>",
				"<h4><a class='scrape-new'>Try Scraping New Articles</a></h4>",
				"<h4><a href='/saved'>Go to Saved Articles</a></h4>",
				'</div>',
				'</div>'
			].join('')
		);
		// Appending this data to the page
		articleContainer.append(emptyAlert);
	}

	function removeFromSaved() {
		// This function is triggered when the user wants to save an article
		// When we rendered the article initially, we attached a javascript object containing the headline id
		// to the element using the .data method. Here we retrieve that.
		var articleToUnSave = $(this).parents('.card').data();
		// Remove card from page
		$(this).parents('.card').remove();

		articleToUnSave.saved = false;
		// Using a patch method to be semantic since this is an update to an existing record in our collection
		$.ajax({
			method: 'PUT',
			url: '/articles/' + articleToUnSave._id,
			data: articleToUnSave
		}).then(function(data) {
			// If the data was saved successfully
			if (data.saved === false) {
				// Run the initPage function again. This will reload the entire list of articles
				initPage();
			}
		});
	}

	function handleArticleClear() {
		$.get('api/clear').then(function() {
			articleContainer.empty();
			initPage();
		});
	}
	initPage();
});
