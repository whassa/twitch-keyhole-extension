import React, { useState } from 'react'
import Axios from 'axios'
import _ from 'lodash'
import { usePopper } from 'react-popper';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import { filterJintekiCards as filterCards } from './FilteringFunction';
import factions from './Factions';

const STATUS_TYPE = {
    loading: 1,
    working: 2,
    notSelected: 3,
    notConfiguredCorrectly: 4,
};

export default class Jinteki extends React.Component{
	constructor(props){
    	super(props)
    	this.twitch = window.Twitch ? window.Twitch.ext : null
    	this.state = {
    		apiKey: this.props.apiKey,
            status: STATUS_TYPE.loading,
            theme: 'light',
            identity: {},
            cards: [],
            deckName: '',
            anchorEl: null,
            open: false,
            imgSrc: '',
            apiCards: {},
            interval: () => {},
    	};

        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.fetchJintekiData = this.fetchJintekiData.bind(this);
        // this.escapeOutput = this.escapeOutput.bind(this);
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
            this.fetchFactionInfo();
            this.fetchJintekiData(this.state.apiKey);
            // One minute interval
            var intervalId = setInterval( () => {
                this.fetchJintekiData(this.state.apiKey)
            }, 60000)
            this.setState({intervalId: intervalId});
            

            this.twitch.onAuthorized((auth)=>{
                if(!this.state.finishedLoading){
                    // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.
                   
                    // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
                }
            })

            this.twitch.onContext((context,delta)=>{
                this.contextUpdate(context,delta)
            })
        }
    }

    componentWillUnMount() {
        clearInterval(this.state.intervalId);  
    }


    escapeOutput(toOutput){
        return toOutput.replace(/\&/g, '&amp;')
            .replace(/\</g, '&lt;')
            .replace(/\>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/\'/g, '&#x27')
            .replace(/\//g, '&#x2F');
    }

    fetchFactionInfo(){
        const the = this;
        // Get some information about factions
        Axios.get('https://netrunnerdb.com/api/2.0/public/factions?_locale=en').then(
            (response) => {
                let factions = {};
                for (var i = response.data.data.length - 1; i >= 0; i--) {
                    factions[response.data.data[i].code] = response.data.data[i]
                }
                the.setState({ factions })
            }
        );
    }


    fetchJintekiData(apiKey){
        const the = this;
        const apiRequest = 'https://jinteki.net/game/decklist';
        const req1 = Axios.get(apiRequest, { 
            headers: {
                'X-JNET-API': this.escapeOutput(apiKey),
            }
        }).then( async ({status, data}) => {
            if (status === 200) {
                if (the.state.deckName !== data.name
                    && the.state.identity !== data.identity
                    && the.state.apiCards !== data.cards
                ) {
                    // yahooo deck selected
                    let filteredCards = await filterCards(data.cards);
                    the.setState({ 
                        apiCards: data.cards,
                        cards: filteredCards,
                        deckName: data.name,
                        identity: data.identity,
                        status: STATUS_TYPE.working,
                    });
                }
            } else if (status === 204) {
                // deck has not been selected yet
                the.setState({ status: STATUS_TYPE.notSelected });
            }
        }).catch(() => {
            // Not configured correctly 
            the.setState({ status: STATUS_TYPE.notConfiguredCorrectly });
        });
    }

    handleClick(event, imgSrc) {
        this.setState({
            anchorEl: event.currentTarget,
            open: Boolean(event.currentTarget),
            imgSrc: imgSrc,
        });
    }

    handleClose(event) {
        this.setState({anchorEl: event.currentTarget, open: false});
    }

    factionCost( {factioncost, faction }, quantity){
        let cost = ''
        if (faction !== this.state.identity.details.faction){
            for (let i = 0; i < factioncost*quantity; i++) {
                cost += '●'
            }
        }
        return (
            <span 
                style={{ 
                    color: `#${factions[faction].color}`,
                    borderColor: `#${factions[faction].color}`,
                }}
            >
                {
                    cost
                }
            </span>
        )
        
    }

    cardsItem(obj) {
        let src = `https://netrunnerdb.com/card_image/large/${obj.details.code}.jpg`;
        let imgLink =  `https://netrunnerdb.com/en/card/${obj.details.code}`;
        return ( 
            <li className="card-item" key={obj.details.code}>
                <span 
                    className="card"
                    onMouseEnter={(e) => { this.handleClick(e, src ) }}
                    onMouseLeave={this.handleClose}
                >
                    <a className="card-link" href={imgLink} target="_blank" rel="noopener noreferrer">
                         {obj.qty}x {obj.title} {this.factionCost(obj.details, obj.qty)}
                    </a>
                </span>
            </li>
        );
    }

    cardsInfo(array, name) {
        if (array.length > 0) {
            return(
                <div>
                    <h3 className="card-type">{name}</h3>
                    <ul className="card-list">
                        {array.map( 
                            (obj) => 
                                this.cardsItem(obj)
                            )
                        }
                    </ul>
                </div>
            );
        }
        return null;
    }

    renderDeckList(){
        return (
            <div className="deck-list">
                {this.cardsInfo(this.state.cards.agenda, 'Agenda')}
                {this.cardsInfo(this.state.cards.asset, 'Asset')}
                {this.cardsInfo(this.state.cards.operation, 'Operation')}
                {this.cardsInfo(this.state.cards.upgrade, 'Upgrade')}
                {this.cardsInfo(this.state.cards.barrier, 'Barrier')}
                {this.cardsInfo(this.state.cards.codeGate, 'Code Gate')}
                {this.cardsInfo(this.state.cards.sentry, 'Sentry')}
                {this.cardsInfo(this.state.cards.otherIce, 'Other Ice')}
                {this.cardsInfo(this.state.cards.event, 'Event')}
                {this.cardsInfo(this.state.cards.hardware, 'Hardware')}
                {this.cardsInfo(this.state.cards.resource, 'Resource')}
                {this.cardsInfo(this.state.cards.icebreaker, 'Icebreaker')}
                {this.cardsInfo(this.state.cards.program, 'Program')}
                <Popover
                    className="popover"
                     anchorOrigin={{
                        vertical: 'center',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'center',
                        horizontal: 'left',
                    }}
                    anchorEl={this.state.anchorEl}
                    open={this.state.open}
                    onClose={this.handleClose}
                >
                  <img src={this.state.imgSrc} width="250" />
                </Popover>
            </div>
        )
    }

    render(){
        let stuffToRender = (
            <div>The application seems to have a problem with please refresh your browser</div>
        );
        if (this.state.status === STATUS_TYPE.loading) {
            stuffToRender = (
                <div className="lds-ring"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
            );
        } else if (this.state.status === STATUS_TYPE.working) {
            let src = `https://netrunnerdb.com/card_image/large/${this.state.identity.details.code}.jpg`;
            let imgLink = `https://netrunnerdb.com/en/card/${this.state.identity.details.code}`;
            stuffToRender = (
                <>
                    <h1 
                        className="deck-title"
                    > 
                        {this.state.deckName}
                    </h1>
                    <h2
                        className="deck-identity"
                        onMouseEnter={(e) => { this.handleClick(e, src ) }}
                        onMouseLeave={this.handleClose}
                    > 
                        <a 
                            className="card-link"
                            href={imgLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                            }}
                        >
                            {this.state.identity.title} 
                        </a>
                    </h2>
                    {this.renderDeckList()}
                </>
            );
        } else if (this.state.status === STATUS_TYPE.notSelected) {
            stuffToRender = (
                <>
                    The streamer is in the lobby and hasn't select there deck yet.
                    The application will refresh itself after 1 minute.
                </>
            );
        } else if (this.state.status === STATUS_TYPE.notConfiguredCorrectly) {
            stuffToRender = (
                <>
                    The application is not set correctly or the streamer is not in a current game
                </>
            );
        } 
        return  (
            <div className="App">
                <div className={'App-dark'} >
                    {stuffToRender}
                </div>
            </div>
        );
    }
}