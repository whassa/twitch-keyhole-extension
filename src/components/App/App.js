import React from 'react'
import Axios from 'axios'
import Authentication from '../../util/Authentication/Authentication'

import './App.css'

export default class App extends React.Component{
    constructor(props){
        super(props)
        this.Authentication = new Authentication()

        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
        
        this.state={
            finishedLoading: false,
            theme: 'light',
            isVisible: true,
            unAvailable: false,

            deckName: '',
        }
    }

    contextUpdate(context, delta){
        if(delta.includes('theme')){
            this.setState(()=>{
                return {theme:context.theme}
            })
        }
    }

    visibilityChanged(isVisible){
        this.setState(()=>{
            return {
                isVisible
            }
        })
    }

    componentDidMount(){
        if(this.twitch){
            this.twitch.onAuthorized((auth)=>{
                this.Authentication.setToken(auth.token, auth.userId)
                if(!this.state.finishedLoading){
                    // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.
                    console.log(this.twitch.configuration.broadcaster)
                    try {
                        let decklist = Number(this.twitch.configuration.broadcaster.content);
                        console.log(decklist)
                        if (Number.isFinite(decklist)){
                            //https://netrunnerdb.com/api/2.0/public/deck/1
                            const the = this;
                            Axios.get('https://netrunnerdb.com/api/2.0/public/deck/'+decklist)
                                .then(  async (response) => {
                                    // handle success
                                    let data = response.data.data[0];
                                    let cards = data.cards;
                                    let cardsInfo = [];
                                    for (var cardId in cards) {
                                        const card = await Axios.get('https://netrunnerdb.com/api/2.0/public/card/'+cardId).then((response) => {
                                            return response.data.data[0];
                                        })
                                        cardsInfo.push(card);
                                    }
                                    console.log(cardsInfo);
                                    

                                    the.setState({ deckName: data.name})
                                    return response;
                                })
                                .catch(function (error) {
                                    // handle error
                                    console.log(error);
                                })
                                .then(function () {
                                    // always executed
                                });

                        }

                        this.setState(()=>{
                            return {finishedLoading:true}
                        })
                    } catch (error) {
                        console.log(error)
                        this.setState({unAvailable: true})
                    }
                    // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
                   
                }
            })

            this.twitch.listen('broadcast',(target,contentType,body)=>{
                this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)
                // now that you've got a listener, do something with the result... 

                // do something...

            })

            this.twitch.onVisibilityChanged((isVisible,_c)=>{
                this.visibilityChanged(isVisible)
            })

            this.twitch.onContext((context,delta)=>{
                this.contextUpdate(context,delta)
            })
        }
    }

    componentWillUnmount(){
        if(this.twitch){
            this.twitch.unlisten('broadcast', ()=> console.log('successfully unlistened'))
        }
    }

    fetchDeckList(){

    }
    
    render(){
        if (this.state.unAvailable) {
            return (
                <div className="App">
                    There is no current decklist.
                </div>
            );
        }
        if(this.state.finishedLoading && this.state.isVisible){
            return (
                <div className="App">
                    <div className={'App-dark'} >
                        <h1> {this.state.deckName} </h1>
                    </div>
                </div>
            )
        }else{
            return (
                <div className="App">
                </div>
            )
        }

    }
}