var baseURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
var searchURL = "esearch.fcgi?";
var summaryURL = "esummary.fcgi?";
var originalURL = "https://doi.org/";
var scihubURL = "https://sci-hub.tw/";

var db = "pubmed";
var retmode = "json";
var scihubFlag = false;

function generateSearchURL(reldate, term, retmax, author, journal) {
    var url = baseURL + searchURL + 'db=' + db + '&retmode=' + retmode + '&term=' + author + '[Author]' + journal + '[Journal]' + term + "&retmax=" + retmax;
    if(reldate != 0) {
	return url + "&reldate" + reldate;
    }
    return url;
}

function generateSummaryURL(UIDs) {
    var UIDCSV = UIDs.join(',');
    return baseURL + summaryURL + '&db=' + db + '&retmode=' + retmode + '&id=' + UIDCSV;
}

function sendSearchRequest(URL) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
	if(xhr.readyState == XMLHttpRequest.DONE) {
	    processSearchResponse(xhr.responseText);
	}
    }
    xhr.open("GET", URL);
    xhr.send();
}

function sendSummaryRequest(URL) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
	if(xhr.readyState == XMLHttpRequest.DONE) {
	    processSummaryResponse(xhr.responseText);
	}
    }
    xhr.open("GET", URL);
    xhr.send();
}

function processSearchResponse(responseText) {
    var obj = JSON.parse(responseText);
    var retmax = obj.esearchresult.retmax;
    var count = obj.esearchresult.count;
    var idList = obj.esearchresult.idlist;
    reportResults(count, retmax);
    sendSummaryRequest(generateSummaryURL(idList));
}

function reportResults(count, retmax) {
    _("result-description").innerHTML = "Displaying " + retmax + " out of " + count + " results.";
}

function insertResult(id, pubdate, authors, title, doi) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    if(scihubFlag) {
	a.href = scihubURL + doi;
    } else {
	a.href = originalURL + doi;
    }
    a.target = "_blank";
    var span_id = document.createElement('span');
    span_id.classList.add("result-id");
    var span_pubdate = document.createElement('span');
    span_pubdate.classList.add("result-pubdate");
    var span_authors = document.createElement('span');
    span_authors.classList.add("result-authors");
    var span_title = document.createElement('span');
    span_title.classList.add("result-title");
    var span_doi = document.createElement('span');
    span_doi.classList.add("result-doi");
    
    span_id.innerHTML = id;
    span_id.setAttribute("title", id);
    span_pubdate.innerHTML = pubdate;
    span_pubdate.setAttribute("title", pubdate);
    span_authors.innerHTML = authors.join(", ");
    span_authors.setAttribute("title", authors.join(", "));
    span_title.innerHTML = title;
    span_title.setAttribute("title", title);
    span_doi.innerHTML = doi;
    span_doi.setAttribute("title", doi);
    a.appendChild(span_title);
    a.appendChild(span_authors);
    a.appendChild(span_pubdate);
    a.appendChild(span_id);
    a.appendChild(span_doi);
    li.appendChild(a);
    _("results").appendChild(li);
    scrapeAbstract(li, id);
    li.addEventListener("mouseover", function() {
	document.getElementById("abstract-viewer").firstElementChild.innerHTML = li.dataset.abstr;
    });
}

function scrapeAbstract(element, PMID) {
    let URL = "https://pubmed.ncbi.nlm.nih.gov/" + PMID;
    let originHackURL = "https://api.allorigins.win/raw?url="
    //"http://allow-any-origin.appspot.com/";
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
	    element.dataset.abstr = getAbstract(new DOMParser().parseFromString(xhr.responseText, "text/html"));
	}
    };
    xhr.open("GET", originHackURL + URL, true);
    xhr.send();
}

function getAbstract(doc) {
    return doc.getElementById("enc-abstract").firstElementChild.innerHTML;
}

function processSummaryResponse(responseText) {
    var obj = JSON.parse(responseText);
    var idList = obj.result.uids;
    for(var i = 0; i < idList.length; i++) {
	var currentId = idList[i];
	var pubdate;
	var authors = [];
	var title;
	var doi;
	for(var j = 0; j < Object.keys(obj.result).length; j++) {
	    var element = Object.keys(obj.result)[j];
	    if(currentId == element) {
		element = Object.values(obj.result)[j];
		pubdate = element.pubdate;
		for(var k = 0; k < element.authors.length; k++) {
		    authors.push(element.authors[k].name);
		}
		for(var l = 0; l < element.articleids.length; l++) {
		    if(element.articleids[l].idtype == "doi") {
			doi = element.articleids[l].value;
		    }
		}
		title = element.title;
	    }
	}
	insertResult(currentId, pubdate, authors, title, doi);
    }
}

function init() {
    _("search-button").addEventListener("click", function() {
	var searchText = _("search-field").value;
        var reldate = _("release-age").value;
	var retmax = _("retmax-field").value;
        var author = _("author").value;
        var journal = _("journal").value;
	if(_("source-original").checked) {
	    scihubFlag = false;
	} else {
	    scihubFlag = true;
	}
        if(reldate == '') {
	    reldate = 0;
	}
	if(retmax > 200) {
	    return;
	}
	while(_("results").firstChild) {
	    _("results").removeChild(_("results").firstChild);
	}
	sendSearchRequest(generateSearchURL(reldate, searchText, retmax, author, journal));
    });

    document.addEventListener("keydown", function(e) {
	if(e.key == "Enter") {
	    _("search-button").click();
	}
    });
}

function _(id) {
    return document.getElementById(id);
}
