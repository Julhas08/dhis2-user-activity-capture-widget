import React, { Component } from 'react';
const baseURL = "../../../";
const fetchOptions = {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }
    };
const fetchOptionsGet = {
        headers: {
            Accept: 'application/json',

        }
    };    
class GetUserInformation extends Component{  

  constructor(props){
    super(props);
    this.state= {
      currentUserName : "",
      lastVisitedDate : null,
      lastVisitedTime : null,
      endTime : null,
    }
    this.onUnload = this.onUnload.bind(this);
  }
  // Return current date time
  getCurrentDateTime = e =>{
    let currentdate = new Date(); 
    let day;
    let month;
    if(currentdate.getDate() > 9){            
      day = currentdate.getDate();
    } else {
      day = "0" +currentdate.getDate();
    }
    if(currentdate.getMonth() > 9){
      month = (currentdate.getMonth()+1);
    } else {            
      month = "0" +(currentdate.getMonth()+1);
    }
    let datetime = 
          + currentdate.getFullYear() + "-"  
          + month + "-" 
          + day + " "
          + currentdate.getHours() + ":"  
          + currentdate.getMinutes() + ":" 
          + currentdate.getSeconds(); // End date format

    return datetime;      

  } 
  // Before Unload
  onUnload = e => {
    e.preventDefault();

    let datetime = this.getCurrentDateTime(); // End date format
    // Return current user information  
      fetch(baseURL+'api/me',fetchOptionsGet).then(res => res.json()) 
          .then(currentUser => {
        fetch(baseURL+'api/dataStore/useractivitymonitor/'+currentUser.id,fetchOptions).then(res => res.json()) 
          .then(userInteraction => {
              let lastObj     = parseInt(userInteraction[0].dashboardInfo.length);
              let lastIndex   = lastObj-1;
              let lastVisitedJson = userInteraction[0].dashboardInfo[lastIndex];
              lastVisitedJson.endTime = datetime;
              userInteraction[0].dashboardInfo.push(lastVisitedJson);

              fetch(baseURL+'api/dataStore/useractivitymonitor/'+currentUser.id, Object.assign({}, fetchOptions, { method: "PUT", body: JSON.stringify(userInteraction), dataType: "application/json; charset=utf-8"})
                ).then(res => res.json()) 
                .then(response => {
                    console.log("Successfully updated before switching!");

                });

          });
      });
    // console.log("this.state.endTime: ", this.state.endTime);

  };

  
  componentDidMount(){
     window.addEventListener("beforeunload", this.onUnload);
    // Dashboard visit information send to datastore app
      let splitURL      = document.URL.split('/');
      let dashboardUrl  = splitURL[splitURL.length -1];
      let dashboardItem = dashboardUrl.split("=");
      let userOrgUnits  = [];

    // Return current user information  
      fetch(baseURL+'api/me',fetchOptionsGet).then(res => res.json()) 
          .then(currentUser => {
            let userOrganisationUnits = [];
            for (var i = 0; i < currentUser.organisationUnits.length; i++) {
              userOrganisationUnits.push(currentUser.organisationUnits[i].id)
            }
            // console.log("userOrganisationUnits: ", userOrganisationUnits);
    // Current user and last visited  
            fetch(baseURL+'api/dataStore/useractivitymonitor/'+currentUser.id,fetchOptions).then(res => res.json()) 
            .then(response => {
              let lastObj     = parseInt(response[0].dashboardInfo.length);
              let lastIndex   = lastObj-1;
              let lastVisited = response[0].dashboardInfo[lastIndex].startTime;
              let date = lastVisited.split(" ");
              this.setState({
                currentUserName  : currentUser.name,
                lastVisitedDate  : date[0],
                lastVisitedTime  : date[1],
              });
            }); // end current user and last visited

    // To find current user organisation unit name and concat it to json payload
            fetch(baseURL+'api/organisationUnits?fields=name,level,paging=false&filter=id:in:['+userOrganisationUnits+']',fetchOptions).then(res => res.json()) 
            .then(orgInfo => {
              let sortedOrgUnit= orgInfo.organisationUnits.sort(function(a, b){return a.level - b.level});
                userOrgUnits.push(sortedOrgUnit);           
            }); // End of org units 

    // Start and end date time format  
            let datetime = this.getCurrentDateTime(); // End date format
    // Fetch current user dashboard information                   
            fetch(baseURL+'api/dashboards?fields=id,name,dashboardItems[:all]',fetchOptions).then(res => res.json()) 
            .then(response => {
              //let dashboardItemId = "Wz6dl1Lp5fo";
              let dashboardItemId = dashboardItem[1];

              for (let i = 0; i < response.dashboards.length; i++) {
                Object.keys(response.dashboards[i].dashboardItems).map((key) => {
                    if(response.dashboards[i].dashboardItems[key].id === dashboardItemId){
                      let dasbhaordId   = response.dashboards[i].id;
                      let dasbhaordName = response.dashboards[i].name;

              // To make JSON playload        
                      let jsonPayload        = {"userId": currentUser.id,"name": currentUser.name,"email": currentUser.email,"gender": currentUser.gender,"lastLogin": currentUser.lastLogin,"orgUnits": userOrgUnits,"dashboardInfo":[{"dashboardItemId":dashboardItemId,"startTime":datetime,"dasbhaordId":dasbhaordId,"dasbhaordName": dasbhaordName}]};
                      let interactedActions  = [];
                      interactedActions[0]   = jsonPayload;
                      let jsonConvertedArray = JSON.stringify(interactedActions);
                      // console.log("jsonConvertedArray: ", jsonConvertedArray);
              // Create and Post new user dashboard activity to DataStore app
                      fetch(baseURL+'api/dataStore/useractivitymonitor/'+currentUser.id, Object.assign({}, fetchOptions, { method: "POST", body: jsonConvertedArray, contentType:"application/json; charset=utf-8", dataType: "json"})
                      ).then(res => res.json()) 
                      .then(response => {              
                          // console.log("Data Store POST response: ", response);

              // If user already exist then fetch user detail            
                          if(response.httpStatusCode===409){
                            fetch(baseURL+'api/dataStore/useractivitymonitor/'+currentUser.id,fetchOptions).then(res => res.json()) 
                            .then(response => {
                            
                          // If response is not empty    
                              let interactedActions = [];                        
                              if(response.length === 1){
                                interactedActions = response;
                              }

                          // New JSON  
                              let updatedJson = {"dashboardItemId":dashboardItemId,"startTime":datetime,"dasbhaordId":dasbhaordId,"dasbhaordName": dasbhaordName};
                            
                          // End date time calculation and set to previous JSON object  
                              let lastObj = parseInt(interactedActions[0].dashboardInfo.length);
                              let lastObjPreValue = lastObj-1;
                              if(this.state.endTime == null){
                                interactedActions[0].dashboardInfo[lastObjPreValue].endTime = datetime;
                              } else {
                                interactedActions[0].dashboardInfo[lastObjPreValue].endTime = this.state.endTime;
                              }
                              
                          
                          // New visited dashboard concat to the existing json object   
                              interactedActions[0].dashboardInfo.push(updatedJson);
                              jsonConvertedArray = JSON.stringify(interactedActions);
                              //console.log("jsonConvertedArray before update: ",jsonConvertedArray)                  
                          
              // Updated lasted JSON object to Data Store  
                              fetch(baseURL+'api/dataStore/useractivitymonitor/'+currentUser.id, Object.assign({}, fetchOptions, { method: "PUT", body: jsonConvertedArray, dataType: "application/json; charset=utf-8"})
                                ).then(res => res.json()) 
                                .then(response => {
                                    // console.log("Data Store PUT response : ", response);
                                });
                            });  
                            
                          }
                       });
                    }
                    return null;
                })
                
              }
             });  
      }); // end of init  
  }
  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.onUnload)
  }
	render(){
    
		return(
			<div className="lastVisited"> 
        <h3> Hi {this.state.currentUserName}! </h3>
        <h4>You last visited on {this.state.lastVisitedDate} at {this.state.lastVisitedTime}</h4>
			</div> 
		);
	}
}

export default GetUserInformation;
