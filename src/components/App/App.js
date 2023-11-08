import React, { useState } from "react";
import "@babel/polyfill";
import _ from "lodash";
import "./App.css";
import NetrunnerDb from "./NetrunnerDb";
import Jinteki from "./Jinteki";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.state = {
      apiKey: "",
      decklistId: "",
      publishDeckList: "",
      appType: null,
      unAvailable: true,
    };
  }

  componentDidMount() {
    if (this.twitch) {
      this.twitch.configuration.onChanged(() => {
        try {
          let obj = JSON.parse(this.twitch.configuration.broadcaster.content);
          // Jinteki
          /**
                    if (obj.apiKey) {
                        let apiKey = obj.apiKey;
                        if ( _.isString(apiKey)){
                            this.setState(()=> {
                                return {
                                    apiKey,
                                    appType: 'jinteki',
                                }
                            })
                        }
                    } else { */
          // NetrunnerDb
          if (obj.decklistId) {
            if (!Number(obj.decklistId)) {
              const uuidRegex =
                /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
              const decklistUUID = obj.decklistId.match(uuidRegex);
              if (decklistUUID) {
                let decklistId = decklistUUID[0];
                let publishDeckList = obj.publishDeckList;
                this.setState(() => {
                  return {
                    decklistId,
                    publishDeckList,
                    appType: "netrunnerDb",
                  };
                });
              }
              return;
            }

            let decklist = Number(obj.decklistId);
            let publishDeckList = obj.publishDeckList;
            if (Number.isFinite(decklist)) {
              this.setState(() => {
                return {
                  decklistId: decklist,
                  publishDeckList,
                  appType: "netrunnerDb",
                };
              });
            }
          }
        } catch (error) {
          this.setState({ unAvailable: true });
        }
      });
    }
  }

  render() {
    if (this.state.appType === "netrunnerDb") {
      return (
        <NetrunnerDb
          decklistId={this.state.decklistId}
          publishDeckList={this.state.publishDeckList}
        />
      );
    } else if (this.state.appType === "jinteki") {
      return <Jinteki apiKey={this.state.apiKey} />;
    }
    return (
      <div className="App">
        <div className={"App-dark"}>
          The Streamer has not set up the apps properly. Refresh to see if it
          has changed!
        </div>
      </div>
    );
  }
}
