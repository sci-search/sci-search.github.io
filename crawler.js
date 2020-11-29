const baseURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
const searchURL = "esearch.fcgi?";
const summaryURL = "esummary.fcgi?";

const db = "pubmed";
const retmode = "json";

window.onload = function() {

    document.addEventListener("keydown", function(e) {
	if(e.key == "Enter") {
	    _("search-button").click();
	}
    });

    const app = Vue.createApp({
	data() {
	    return {
		scihubFlag: false,
		searchText: "",
		reldate: 0,
		retmax: 20,
		author: "",
		journal: "",
		results: [],
		abstractText: ""
	    }
	},

	computed: {
	    getURL() {
		if(this.scihubFlag)
		    return "https://sci-hub.st/";
		else
		    return "https://doi.org/";
	    }
	},
	
	methods: {
	    sendSearchRequest() {
		const context = this;
		this.results = [];
		if(this.retmax > 200)
		    this.retmax = 200;
		let url = baseURL + searchURL + 'db=' + db + '&retmode=' + retmode + '&term=' + this.author + '[Author]' + this.journal + '[Journal]' + this.searchText + "&retmax=" + this.retmax;
		if(this.reldate != 0) {
		    url += "&reldate" + this.reldate;
		}
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
		    if(xhr.readyState == XMLHttpRequest.DONE) {
			context.processSearchResponse(xhr.responseText);
		    }
		}
		xhr.open("GET", url);
		xhr.send();

	    },

	    processSearchResponse(responseText) {
		let obj = JSON.parse(responseText);
		let retmax = obj.esearchresult.retmax;
		let count = obj.esearchresult.count;
		let idList = obj.esearchresult.idlist;
		this.reportResults(count, retmax);
		this.sendSummaryRequest(idList);
	    },

	    reportResults(count, retmax) {
		_("result-description").innerHTML = "Displaying " + retmax + " out of " + count + " results.";
	    },

	    sendSummaryRequest(UIDs) {
		const context = this;
		let UIDCSV = UIDs.join(',');
		let url = baseURL + summaryURL + '&db=' + db + '&retmode=' + retmode + '&id=' + UIDCSV;
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
		    if(xhr.readyState == XMLHttpRequest.DONE) {
			context.processSummaryResponse(xhr.responseText);
		    }
		}
		xhr.open("GET", url);
		xhr.send();

	    },

	    processSummaryResponse(responseText) {
		const context = this;
		let obj = JSON.parse(responseText);
		let idList = obj.result.uids;
		for(let i = 0; i < idList.length; i++) {
		    let currentId = idList[i];
		    let pubdate;
		    let authors = [];
		    let title;
		    let doi;
		    for(let j = 0; j < Object.keys(obj.result).length; j++) {
			let element = Object.keys(obj.result)[j];
			if(currentId == element) {
			    element = Object.values(obj.result)[j];
			    pubdate = element.pubdate;
			    for(let k = 0; k < element.authors.length; k++) {
				authors.push(element.authors[k].name);
			    }
			    for(let l = 0; l < element.articleids.length; l++) {
				if(element.articleids[l].idtype == "doi") {
				    doi = element.articleids[l].value;
				}
			    }
			    title = element.title;
			}
		    }
		    let URL = "https://pubmed.ncbi.nlm.nih.gov/" + currentId;
		    let originHackURL = "https://api.allorigins.win/raw?url="
		    //"http://allow-any-origin.appspot.com/";
		    let xhr = new XMLHttpRequest();
		    xhr.responseType = "document";
		    xhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
			    let abstr = "";
			    try {
				abstr = xhr.response.getElementById("enc-abstract").firstElementChild.innerHTML;
			    } catch(e) {

			    }
			    context.results.push({
				id: currentId,
				pubdate: pubdate,
				authors: authors,
				title: title,
				doi: doi,
				abstr: abstr
			    });
			}
		    };
		    xhr.open("GET", originHackURL + URL, true);
		    xhr.send();
		}
	    },	    
	}
    });

    app.directive('focus', {
	mounted(el) {
	    el.focus()
	}
    });

    const vm = app.mount("body");
}

function _(id) {
    return document.getElementById(id);
}
