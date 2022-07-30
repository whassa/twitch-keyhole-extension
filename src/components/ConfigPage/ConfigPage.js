import React from 'react'
import Authentication from '../../util/Authentication/Authentication'
import Axios from 'axios'
import Switch from '@material-ui/core/Switch';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import HelpIcon from '@material-ui/icons/Help';
import './Config.css'

/** IMPORTANT **/
/** AS LONG AS THERE'S NO DIFFERENCE BETWEEN THE LIVE CONFIG AND CONFIG  THE CONFIG PAGE WON'T BE USED AND
    THE LIVE CONFIG WILL BE USED
**/
export default class ConfigPage extends React.Component{
    constructor(props){
        super(props)
        this.Authentication = new Authentication()

        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
        this.twitch.onError((error)=> {})
        this.state={
            finishedLoading:false,
            theme:'light',
            decklistId: 1,
            publishDeckList: false,
            error: false,
        }
        this.saveState = this.saveState.bind(this);
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

            this.twitch.configuration.onChanged( () => {
                let decklist;
                try {
                    var obj = JSON.parse(this.twitch.configuration.broadcaster.content);
                    let decklist = Number(obj.decklistId);
                    let publishDeckList =  (obj.publishDeckList);
                    if (Number.isFinite(decklist)){
                        this.setState(()=> {
                            return {
                                decklistId: decklist,
                                publishDeckList: publishDeckList,
                            }
                        })
                    }
                } catch(error){
                    this.setState(()=>{
                        return {finishedLoading:true}
                    })

                }
                // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.
                // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
            });


            this.twitch.onAuthorized((auth)=>{
                this.Authentication.setToken(auth.token, auth.userId)
                if(!this.state.finishedLoading){
                    this.setState(()=>{
                        return {finishedLoading:true}
                    })
                    // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.
                    // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
                }
            })
            
            this.twitch.onContext((context,delta)=>{
                this.contextUpdate(context,delta)
            })
        }
    }

    changeDeckList(e) {
        var value = e.target.value
        this.setState({ decklistId: value});

        let req = ( this.state.publishDeckList 
            ? 'https://netrunnerdb.com/api/2.0/public/decklist/'
            : 'https://netrunnerdb.com/api/2.0/public/deck/'
        );
        let the = this;
        Axios.get(req+value)
            .then(() => {
                the.setState({ error: false });
            }).catch( (error) => {
                the.setState({ error: true })
            })
    }

    saveState() {
        this.twitch.configuration.set('broadcaster', '1', 
            JSON.stringify({ 
                decklistId: this.state.decklistId,
                publishDeckList: this.state.publishDeckList
            })
        );
        this.twitch.send("broadcast", "application/json", { 
            decklistId: this.state.decklistId,
            publishDeckList: this.state.publishDeckList
        })
    }

    render(){
        if(this.state.finishedLoading){
            return(
                <>
                    <script src="https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js"></script>
                    <div className="Config">
                        <div className={this.state.theme==='light' ? 'Config-light' : 'Config-dark'}>
                            <label> Please enter a deck list code :</label>
                            <input 
                                type="text"
                                placeholder="Enter decklist id" 
                                value={this.state.decklistId}
                                onChange={(e) => {this.changeDeckList(e)}}
                            />
                            {this.state.error && (<div>
                                    Are you sure the deck is public or it's the correct id?
                                </div>
                            )}
                            <div>
                                <Switch
                                    checked={this.state.publishDeckList}
                                    onChange={() => {this.setState({publishDeckList: !this.state.publishDeckList})}}
                                    color="primary"
                                    name="checkedB"
                                />
                                <span>
                                    Check to use a published decklist ID from netrunnerdb.
                                    Leave unchecked to use a private decklist ID instead   <Tooltip 
                                        title="Published decklists have a 5 digit ID number, while private decklists are 6 digits"
                                    >
                                        <HelpIcon style={{ fontSize: 16, color: '#7E7E7E' }} />
                                    </Tooltip>
                                </span>
                            </div>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={this.saveState}
                            >
                                Save Changes
                            </Button>  
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