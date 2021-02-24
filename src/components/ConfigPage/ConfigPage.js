import React from 'react'
import Authentication from '../../util/Authentication/Authentication'
import './Config.css'

export default class ConfigPage extends React.Component{
    constructor(props){
        super(props)
        this.Authentication = new Authentication()

        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
        this.twitch.onError((error)=> {console.log('aloa')})
        this.state={
            finishedLoading:false,
            theme:'light',
            anrDeckId: 1,
        }
    }

    contextUpdate(context, delta){
        if(delta.includes('theme')){
            this.setState(()=>{
                return {theme:context.theme}
            })
        }
    }

    componentDidMount(){
        // do config page setup as needed here
        if(this.twitch){
            this.twitch.onAuthorized((auth)=>{
                this.Authentication.setToken(auth.token, auth.userId)
                if(!this.state.finishedLoading){
                    // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.
                    // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
                    this.setState(()=>{
                        return {finishedLoading:true}
                    },  () => {} )
                }
            })
            
            this.twitch.onContext((context,delta)=>{
                this.contextUpdate(context,delta)
            })
        }
    }
    changeState(e) {
        var value = e.target.value
        this.setState({ anrDeckId: value },
            this.twitch.configuration.set('broadcaster', '1', value)
        );
    }

    render(){
        if(this.state.finishedLoading && this.Authentication.isModerator()){
            return(
                <>
                    <script src="https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js"></script>
                    <div className="Config">
                        <div className={this.state.theme==='light' ? 'Config-light' : 'Config-dark'}>
                            <label> Please enter a deck list code :</label>
                            <input 
                                type="text"
                                placeholder="Enter decklist id" 
                                value={this.state.anrDeckId}
                                onChange={(e) => {this.changeState(e)}}
                            >
                            </input>

                        </div>
                    </div>
                </>
            )
        }
        else{
            return(
                <div className="Config">
                    <div className={this.state.theme==='light' ? 'Config-light' : 'Config-dark'}>
                        Loading...
                    </div>
                </div>
            )
        }
    }
}