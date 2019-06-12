import React, { Component } from 'react';
import './App.css';
import GetUserInformation from './components/GetUserInformation';
class App extends Component {
  render() {
    return (
      <div className="main-area">
        <div className="panel-white">
          <div className="panel-body">
              <GetUserInformation />
          </div>
        </div>

      </div>
    );
  }
}

export default App;
