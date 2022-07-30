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
import TextField from '@material-ui/core/TextField'
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

                        if (!Number(obj.decklistId)) {
                            const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
                            const decklistUUID = obj.decklistId.match(uuidRegex);
                            if (decklistUUID) {
                                let decklistId = decklistUUID[0];
                                let publishDeckList =  (obj.publishDeckList);
                                this.setState(()=> {
                                    return {
                                        decklistId,
                                        publishDeckList,
                                        applicationUse: 'netrunnerdb',
                                    }
                                })
                            }
                            return;
                        }

                        let decklist = Number(obj.decklistId);
                        let publishDeckList =  (obj.publishDeckList);
                        if (Number.isFinite(decklist)){
                            this.setState(()=> {
                                return {
                                    decklistId: decklist,
                                    publishDeckList,
                                    applicationUse: 'netrunnerdb',
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
        let value = e.target.value
        this.setState({ decklistId: value});
        
        let req = ( this.state.publishDeckList 
            ? 'https://netrunnerdb.com/api/2.0/public/decklist/'
            : 'https://netrunnerdb.com/api/2.0/public/deck/'
        );
        let the = this;
        
        if (!Number(value)) {
            console.log()
            const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
            const decklistUUID = value.match(uuidRegex);
            if (decklistUUID) {
                value = decklistUUID
            } else {
                the.setState({ error: true })
                return
            }
        }
        Axios.get(req+value)
            .then((result) => {
                if (result.data && result.data.success) {
                    the.setState({ error: false });
                    return;
                }
                the.setState({ error: true })
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
                <div style={{ marginTop: '10px' }}>
                    Please enter  your jinteki api key  
                        <Tooltip 
                            title="You can generate one in jinteki.net in your account setting in the section API Keys"
                        >
                            <HelpIcon style={{ fontSize: 16, color: '#7E7E7E' }} />
                        </Tooltip>
                </div>
                <TextField 
                    type="text"
                    placeholder="Enter the api key" 
                    value={this.state.apiKey}
                    onChange={(e) => {this.changeApiKey(e)}}
                    fullWidth
                />
                <div style={{ marginTop: '10px' }}>
                    Also make sure to enable the game options when hosting on jinteki.net
                     - Allow API access to game information
                </div>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={this.saveJintekiState}
                    style={{ marginTop: '10px' }}
                >
                    Save Changes
                </Button> 
            </div>
        );
    }

    renderNetrunnerDBOption() {
        return(
            <div>
                <div style={{ marginTop: '10px' }}> Please enter a deck list code :</div>
                <TextField 
                    type="text"
                    placeholder="Enter decklist id" 
                    value={this.state.decklistId}
                    onChange={(e) => {this.changeDeckList(e)}}
                    fullWidth
                />
                {this.state.error && (<div>
                        Are you sure the deck is public or it's the correct id?
                    </div>
                )}
                <div>
                    <Switch
                        checked={!!this.state.publishDeckList}
                        onChange={() => {
                            this.setState({publishDeckList: !this.state.publishDeckList})
                        }}
                        color="primary"
                        name="checkedB"
                    />
                    <span>
                        Check to use a published decklist ID from netrunnerdb.
                        Leave unchecked to use a private decklist ID instead   <Tooltip 
                            title="Published decklists have a 5 digit ID number and are suppose to be public, while private decklists are 7 digits and can be a private decklist"
                        >
                            <HelpIcon style={{ fontSize: 16, color: '#7E7E7E' }} />
                        </Tooltip>
                    </span>
                    <div style={{ marginTop: '10px' }}>
                        Decklist deck list code now supports the new uuid used on netrunnerDB 
                        and you can send save a decklist code with a complete url
                        <Tooltip 
                            title="Example: https://netrunnerdb.com/en/deck/view/f1bfcad4-4f5c-41b6-835f-1a08fbfe08c3 will parse f1bfcad4-4f5c-41b6-835f-1a08fbfe08c3
                            "
                        >
                            <HelpIcon style={{ fontSize: 16, color: '#7E7E7E' }} />
                        </Tooltip>
                       
                    </div>
                </div>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={this.saveNetrunnerDBState}
                    style={{ marginTop: '10px' }}
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
                        <div>
                            Select how to fetch your decklist <Tooltip 
                            title="You can fetch the data through netrunnerDb decklist or directly via a jinteki with an api key"
                            >
                                <HelpIcon style={{ fontSize: 16, color: '#7E7E7E' }} />
                            </Tooltip>
                        </div>
                        <Select
                          value={this.state.applicationUse}
                          onChange={(event) => {this.setState({applicationUse: event.target.value})}}
                          style={{ marginTop: '10px' }}
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