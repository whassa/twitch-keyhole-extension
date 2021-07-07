import React, { useState } from 'react'
import "@babel/polyfill";
import _ from 'lodash'
import './App.css';
import NetrunnerDb from './NetrunnerDb';

export default class App extends React.Component{
    constructor(props){
        super(props)
        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
        this.state = {
            apiKey: '',
            decklistId: '',
            publishDeckList: '',
            appType: null,
            unAvailable: true,
        }
    }

    componentDidMount(){
        if(this.twitch){
            this.twitch.configuration.onChanged( () => {
                try {
                    let obj = JSON.parse(this.twitch.configuration.broadcaster.content);
                    // Jinteki
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
                    } else {
                        // NetrunnerDb
                        if (obj.decklistId){
                            let decklist = Number(obj.decklistId);
                            let publishDeckList =  (obj.publishDeckList);
                            if (Number.isFinite(decklist)){
                                this.setState(()=> {
                                    return {
                                        decklistId: decklist,
                                        publishDeckList,
                                        appType: 'netrunnerDb',
                                    }
                                })
                            }
                        }
                    }

                } catch (error) {
                    console.log(error)
                    this.setState({unAvailable: true})
                }
            });
        }
    }

    render(){
        if ( this.state.appType === 'netrunnerDb'){
            return ( <NetrunnerDb 
                decklistId={this.state.decklistId}
                publishDeckList={this.state.publishDeckList}
            />);
        } else if (this.state.appType === 'jinteki') {

        }
        return (
            <div className="App">
                <div className={'App-dark'} >
                    The user has not set up the apps properly
                </div>
            </div>
        );
    }
}