const electron = require('electron');
const exec = require('child_process').exec;
const $ = require('jquery');
const ipc = electron.ipcRenderer;
var currentlyPlaying;

// Easily run bash commands
var bash = (cmd, cb) => {
    exec(cmd, (error, stdout, stderr) => {
        cb(stdout);
    });
}

// Update the currently playing media
var updateMedia = (path) => {
    // Reset the button text
    $('.directory-list [data-path]').text('Play');

    // Remove the old audio element
    $('.currently-playing').remove('');

    // Add our new source element
    $('body').append('<audio autoplay class="currently-playing"><source src="file://' + path + '" type="audio/mpeg">Your browser does not support the audio element.</audio>');
    currentlyPlaying = $('.currently-playing');
}

// Add the audio element when everything is loaded
$(document).ready(function() {
    // Nothing yet
});

// List the folders/files in a table
$('.folders').on('click', '[data-path]', function() {
    $('.folders [data-path]').removeClass('active');
    $(this).addClass('active');

    var path = $(this).attr('data-path').replace(/ /g, "\\\ ");

    bash('ls -d ' + path + '/*', (data) => {
        var items = data.split("\n").filter((v) => {
            return v !== ''
        });

        // Clear the directory list
        $('.directory-list').html('');

        // Get the currently playing media source
        var source;
        if (currentlyPlaying) {
            source = currentlyPlaying.find('source').attr('src').replace('file://', '');
        }

        $.each(items, (idx, val) => {
            var pieces = val.split('/');
            var buttonTxt = 'Play';

            if (source == val) {
                buttonTxt = 'Pause';

                if (currentlyPlaying[0]) {
                    if (currentlyPlaying[0].paused !== false) {
                        buttonTxt = 'Play';
                    }
                }
            }

            $('.directory-list').append('<tr><td>' + pieces[pieces.length - 1] + '</td><td><button class="btn btn-primary" data-path="' + val + '">' + buttonTxt + '</button></td></tr>');
        });
    });
});

// Play the selected media
$('.directory-list').on('click', '[data-path]', function() {
    var path = $(this).attr('data-path');
    currentlyPlaying = $('.currently-playing');


    // Check if we need to load new media
    if (currentlyPlaying.length <= 0) {
        updateMedia(path);
    } else {
        var source = currentlyPlaying.find('source').attr('src').replace('file://', '');

        // Check if the source is changing
        if (source) {
            if (path != source) {
                updateMedia(path);
            }
        }
    }

    if (currentlyPlaying[0].paused == false) {
        currentlyPlaying[0].pause();
        $(this).text('Play');
    } else {
        currentlyPlaying[0].play();
        $(this).text('Pause');
    }
});

// Open the file dialog to choose the media folder
$('.set-directory').on('click', (e) => {
    ipc.send('open-file-dialog-sheet')
});

// Set the media folder and update the sidebar
ipc.on('selected-directory', (e, path) => {
    bash('ls -d ' + path[0].replace(/ /g, "\\\ ") + '/*/', (data) => {
        var items = data.split("\n").filter((v) => {
            return v !== ''
        });

        // Remove the old folders
        $('.folders .item').remove();

        // Remove the old directory list
        $('.directory-list').html('');

        // Set the footer path
        $('footer .title').text('Current folder: ' + path);
        $.each(items, (idx, val) => {
            var pieces = val.split('/').filter((v) => {
                return v !== ''
            });
            $('.folders').append('<li class="item list-group-item" data-path="' + val + '"><div class="media-body"><span class="media-object pull-left icon icon-folder"></span> <strong>' + pieces[pieces.length - 1] + '</strong></div></li>');
        });
    });
});
