var whois = require('../../common/whoiswrapper.js'),
  conversions = require('../../common/conversions.js');

require('../../common/stringformat.js');

const {
  ipcRenderer
} = require('electron');

const base = 10;

/*
// Receive whois lookup reply
ipcRenderer.on('bulkwhois:results', function(event, domain, domainResults) {

  //ipcRenderer.send('app:debug', "Whois domain reply for {0}:\n {1}".format(domain, domainResults));


  (function() {
    var result;
    if (typeof domainResults === 'object') {
      JSON.stringify(domainResults, null, 2);
      result = domainResults.map(function(data) {
        data.data = parseRawData(data.data);
        return data;
      });
    } else {
      result = parseRawData(domainResults);
    }
    return result;
  })();

});
*/

/*
// Receive bulk whois results
ipcRenderer.on('bulkwhois:resultreceive', function(event, results) {

});
*/

// Bulk whois processing, ui status update
ipcRenderer.on('bw:status.update', function(event, stat, value) {
  ipcRenderer.send('app:debug', "{0}, value update to {1}".format(stat, value)); // status update
  var percent;
  switch (stat) {
    case 'start':
      if ($('#bwpButtonNext').hasClass('is-hidden') === false) {
        $('#bwpButtonNext').addClass('is-hidden');
        $('#bwpButtonPause').removeClass('is-hidden');
        $('#bwpButtonStop').removeClass('is-hidden');
      }
      break;
    case 'domains.processed': // processed domains
      percent = parseFloat((value / parseInt($('#bwTableProcessingTotal').text(), base) * 100).toFixed(1)) || 0;
      $('#bwTableProcessingProcessed').text('{0} ({1}%)'.format(value, percent));
      break;
    case 'domains.waiting': // whois requests waiting reply
      percent = parseFloat((value / parseInt($('#bwTableProcessingSent').text(), base) * 100).toFixed(1)) || 0;
      $('#bwTableProcessingWaiting').text('{0} ({1}%)'.format(value, percent));
      break;
    case 'domains.sent': // sent whois requests
      percent = parseFloat((value / parseInt($('#bwTableProcessingTotal').text(), base) * 100).toFixed(1)) || 0;
      $('#bwTableProcessingSent').text('{0} ({1}%)'.format(value, percent));
      break;
    case 'domains.total': // total domains
      $('#bwTableProcessingTotal').text(value);
      break;
    case 'time.current': // current time
      $('#bwTableProcessingCurrentTime').text('{0}'.format(value));
      break;
    case 'time.remaining': // remaining time
      $('#bwTableProcessingRemainingTime').text('{0}'.format(value));
      break;
    case 'reqtimes.maximum': // maximum request reply time
      $('#bwTableProcessingReqMax').text('{0}ms'.format(value));
      break;
    case 'reqtimes.minimum': // minimum request reply time
      $('#bwTableProcessingReqMin').text('{0}ms'.format(value));
      break;
    case 'reqtimes.last': // last request reply time
      $('#bwTableProcessingReqLast').text('{0}ms'.format(value));
      break;
    case 'reqtimes.average': // Average request reply time
      $('#bwTableProcessingReqAvg').text('{0}ms'.format(value));
      break;
    case 'status.available': // Domains available
      percent = parseFloat((value / parseInt($('#bwTableProcessingTotal').text(), base) * 100).toFixed(1)) || 0;
      $('#bwTableProcessingDomAvail').text('{0} ({1}%)'.format(value, percent));
      break;
    case 'status.unavailable': // Domains unavailable
      percent = parseFloat((value / parseInt($('#bwTableProcessingTotal').text(), base) * 100).toFixed(1)) || 0;
      $('#bwTableProcessingDomUnavail').text('{0} ({1}%)'.format(value, percent));
      break;
    case 'status.error': // Domains error
      percent = parseFloat((value / parseInt($('#bwTableProcessingTotal').text(), base) * 100).toFixed(1)) || 0;
      $('#bwTableProcessingDomError').text('{0} ({1}%)'.format(value, percent));
      break;
    case 'laststatus.available': // Last available domain
      $('#bwTableProcessingLastDomAvail').text('{0}'.format(value));
      break;
    case 'laststatus.unavailable': // Last unavailable domain
      $('#bwTableProcessingLastDomUnavail').text('{0}'.format(value));
      break;
    case 'laststatus.error': // Last error domain
      $('#bwTableProcessingLastDomError').text('{0}'.format(value));
      break;
    case 'finished': // Finished
      $('#bwpButtonPause').addClass('is-hidden');
      $('#bwpButtonStop').addClass('is-hidden');
      $('#bwpButtonNext').removeClass('is-hidden');
      break;
    default:
      break;
  }
});

// Bulk processing, pause/continue process
$('#bwpButtonPause').click(function() {
  var searchStatus = $('#bwpButtonPauseText').text();
  switch (searchStatus) {
    case 'Continue':
      setPauseButton();
      ipcRenderer.send('bw:lookup.continue');
      break;
    case 'Pause':
      $('#bwpButtonPause').removeClass('is-warning').addClass('is-success');
      $('#bwpButtonPauseIcon').removeClass('fa-pause').addClass('fa-play');
      $('#bwpButtonPauseText').text('Continue');
      ipcRenderer.send('bw:lookup.pause');
      break;
    default:
      break;
  }
});

function setPauseButton() {
  $('#bwpButtonPause').removeClass('is-success').addClass('is-warning');
  $('#bwpButtonPauseIcon').removeClass('fa-play').addClass('fa-pause');
  $('#bwpButtonPauseText').text('Pause');
}

// Trigger Bulk whois Stop modal
$('#bwpButtonStop').click(function() {
  ipcRenderer.send('app:debug', "Pausing whois & opening stop modal");
  $('#bwpButtonPause').text().includes('Pause') ? $('#bwpButtonPause').click() : false;
  $('#bwpStopModal').addClass('is-active');
});

// Close modal and allow continue
$('#bwpStopModalButtonContinue').click(function() {
  ipcRenderer.send('app:debug', "Closing Stop modal & continue");
  $('#bwpStopModal').removeClass('is-active');
});

// Stop bulk whois entirely and scrape everything
$('#bwpStopModalButtonStop').click(function() {
  ipcRenderer.send('app:debug', "Closing Stop modal & going back to start");
  $('#bwpStopModal').removeClass('is-active');
  $('#bwProcessing').addClass('is-hidden');
  setPauseButton();
  $('#bwEntry').removeClass('is-hidden');
});

// Stop bulk whois entirely and save/export
$('#bwpStopModalButtonStopSave').click(function() {
  ipcRenderer.send('app:debug', "Closing Stop modal & exporting");
  ipcRenderer.send('bw:lookup.stop');
  $('#bwpStopModal').removeClass('is-active');
  $('#bwProcessing').addClass('is-hidden');
  setPauseButton();
  $('#bwExport').removeClass('is-hidden');
});

// Bulk processing, proceed to export options
$('#bwpButtonNext').click(function() {
  $('#bwProcessing').addClass('is-hidden');
  $('#bwExport').removeClass('is-hidden');
});