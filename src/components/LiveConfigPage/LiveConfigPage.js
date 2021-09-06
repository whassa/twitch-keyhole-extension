import React from 'react'
import Axios from 'axios'
import _ from 'lodash'
import Authentication from '../../util/Authentication/Authentication'
import Switch from '@material-ui/core/Switch';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import HelpIcon from '@material-ui/icons/Help';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import './LiveConfigPage.css'

export default class LiveConfigPage extends React.Component{
    constructor(props){
        super(props)
        this.Authentication = new Authentication()

        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
        this.twitch.onError((error)=> {})
        this.state={
            applicationUse: 'jinteki',
            finishedLoading:false,
            theme:'light',
            apiKey: '',
            decklistId: '',
            publishDeckList: false,
            error: false,
        }
        this.saveNetrunnerDBState = this.saveNetrunnerDBState.bind(this);
        this.saveJintekiState = this.saveJintekiState.bind(this);
    }

    contextUpdate(context, delta){
        if(delta.includes('theme')){
            this.setState(()=>{
                return {theme:context.theme}
            })
        }
    }

    componentDidMount(){
        if(this.twitch){
            this.twitch.configuration.onChanged( () => {
                let decklist;
                try {
                    var obj = JSON.parse(this.twitch.configuration.broadcaster.content);
                    
                    if (obj.apiKey) {
                        let apiKey = obj.apiKey;
                        if ( _.isString(apiKey)){
                            this.setState(()=> {
                                return {
                                    apiKey,
                                }
                            })
                        }
                    }

                    if (obj.decklistId){
                        let decklistId = Number(obj.decklistId);
                        let publishDeckList =  (obj.publishDeckList);
                        if (Number.isFinite(decklistId)){
                            this.setState(()=> {
                                return {
                                    applicationUse: 'netrunnerdb',
                                    decklistId,
                                    publishDeckList,
                                }
                            })
                        }
                    }
                   
                    
                } catch(error){
                    console.log(error);
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
                }
            })

            this.twitch.onContext((context,delta)=>{
                this.contextUpdate(context,delta)
            })
        }
    }

    componentWillUnmount(){
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

    changeApiKey(e) {
        var value = e.target.value
        this.setState({ apiKey: value});
    }

    saveNetrunnerDBState() {
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


    saveJintekiState() {
        this.twitch.configuration.set('broadcaster', '1', 
            JSON.stringify({ 
                apiKey: this.state.apiKey,
            })
        );
        this.twitch.send("broadcast", "application/json", { 
            apiKey: this.state.apiKey,
        })
    }

    renderJintekiOption() {
        return(
            <div>
                <label>
                    Please enter  your jinteki api key  
                        <Tooltip 
                            title="You can generate one in jinteki.net in your account setting in the section API Keys"
                        >
                            <HelpIcon style={{ fontSize: 16, color: '#7E7E7E' }} />
                        </Tooltip>
                </label>
                <input 
                    type="text"
                    placeholder="Enter the api key" 
                    value={this.state.apiKey}
                    onChange={(e) => {this.changeApiKey(e)}}
                />
                <br />
                <label>
                    Also make sure to enable the game options when hosting on jinteki.net
                    <br />
                     - Allow API access to game information
                </label>
                <br />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={this.saveJintekiState}
                >
                    Save Changes
                </Button> 
            </div>
        );
    }

    renderNetrunnerDBOption() {
        return(
            <div>
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
                        onChange={() => {
                            this.setState({publishDeckList: !this.state.publishDeckList
                        })}}
                        color="primary"
                        name="checkedB"
                    />
                    <span>
                        Check to use a published decklist ID from netrunnerdb.
                        Leave unchecked to use a private decklist ID instead   <Tooltip 
                            title="Published decklists have a 5 digit ID number, while private decklists are 7 digits"
                        >
                            <HelpIcon style={{ fontSize: 16, color: '#7E7E7E' }} />
                        </Tooltip>
                    </span>
                </div>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={this.saveNetrunnerDBState}
                >
                    Save Changes
                </Button> 
            </div>
        );
    }
    
    render(){

        const handleChange = (event) => {
            setAge(event.target.value);
        };

        if(this.state.finishedLoading){
            return (
                <div className="LiveConfigPage">
                    <div className={this.state.theme === 'light' ? 'LiveConfigPage-light' : 'LiveConfigPage-dark'} >
                        <Select
                          value={this.state.applicationUse}
                          onChange={(event) => {this.setState({applicationUse: event.target.value})}}
                        >
                          <MenuItem value={'jinteki'}>Jinteki</MenuItem>
                          <MenuItem value={'netrunnerdb'}>Netrunnerdb</MenuItem>
                        </Select>
                        <Tooltip 
                            title="The change might not working during the stream"
                        >
                            <HelpIcon style={{ fontSize: 16, color: '#7E7E7E' }} />
                        </Tooltip>
                        {this.state.applicationUse === 'jinteki' && this.renderJintekiOption()}
                        {this.state.applicationUse === 'netrunnerdb' && this.renderNetrunnerDBOption()}
                    </div>
                </div>
            )
        }else{
            return (
                <div className="LiveConfigPage">
                    <div className={this.state.theme==='light' ? 'Config-light' : 'Config-dark'}>
                        Loading...
                    </div>
                </div>
            )
        }

    }
}