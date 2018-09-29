const { google } = require('googleapis');
const proxy = require('./proxy');

// https://stackoverflow.com/questions/5366849/convert-1-to-0001-in-javascript
function padLeft(nr, n, str){
    return Array(n-String(nr).length+1).join(str||'0')+nr;
}

module.exports = function top(options) {  	
	options = options || {};
	options.hash = options.hash || {};	        
	var maxItems = parseInt(options.hash.maxItems,10) || 10;
	var interval=options.hash.interval || 'allTime';		
	var viewId= options.hash.viewId;
	if (!viewId || !viewId.length)
		return Promise.resolve('No viewId specified');
		
	var currentDate = new Date();
    if (interval=='thisYear') {
		var startDate=currentDate.getFullYear()+'-01-01';
	} else if (interval=='thisMonth') {
		var currentMonth = currentDate.getMonth()+1;		
		var startDate=currentDate.getFullYear()+'-'+padLeft(currentMonth,2)+'-01';		
	} else if (interval=='thisWeek') {		
		var currentDay = currentDate.getDay();
		var currentMonth = currentDate.getMonth()+1;
       	diff = currentDate.getDate() - currentDay + (currentDay == 0 ? -6:1);
		var weekStart = new Date(currentDate.setDate(diff));		
		var startDate = weekStart.getFullYear()+'-'+padLeft(currentMonth)+'-'+padLeft(weekStart.getDate());		
	} else if (interval=='allTime') {
		var startDate='2005-01-01';
	} else {
		return "Invalid value for the interval parameter";
	}
	var scopes = ['https://www.googleapis.com/auth/analytics.readonly'];		
	var key = {
		client_email:process.env.GA_CLIENT_EMAIL, 
		private_key:process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n')
	};			
	
	var authClient = new google.auth.JWT(key.client_email, null, key.private_key, scopes);	
  	return authClient.authorize().then(function() {
			return google.analytics('v3').data.ga.get({ 
				'auth': authClient,
				'ids': 'ga:'+viewId,
				'start-date': startDate,
				'end-date': 'today',
				'metrics': 'ga:pageviews',
				'dimensions':'ga:pagePath',
				'sort':'-ga:pageViews',                                                 
				'filters':'ga:pagePath!@/tag/;ga:pagePath!@/page/;ga:pagePath!=/;ga:pageTitle!=(not set);ga:pagePath!@&',
                'max-results':maxItems
         }).then(function(resp) {
                 var data=[];	                 
				 resp.data.rows.forEach(  row =>  data.push( { 'pagePath':row[0], 'viewCount':row[1] } ) );				 

				 apiOptions = {				
					include: 'author,authors,tags',					
					limit: 'all'					
				};

				return proxy.api.posts.browse(apiOptions).then(function (resp2) {														
					resp2.posts.forEach( post => { 
						var correspondingPost = data.find ( element => element.pagePath==proxy.metaData.getMetaDataUrl(post,false) );
						if (correspondingPost) {
							post.viewCount = correspondingPost.viewCount;
						} else {
							post.viewCount = -1;
						}	
					});					
					resp2.posts.sort((a,b) => b.viewCount-a.viewCount);														
					resp2.posts = resp2.posts.slice(0,maxItems);
					return options.fn(resp2);					
				});								                 
			}).catch(function(err) { 
				return err.toString();
			});								
	});
}