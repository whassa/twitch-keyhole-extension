import React, { useState } from 'react'
import Axios from 'axios'
import _ from 'lodash'
import { usePopper } from 'react-popper';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import "@babel/polyfill";
import './App.css'

export default class App extends React.Component{
    constructor(props){
        super(props)
        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
        this.state={
            hidden: true,
            finishedLoading: false,
            theme: 'light',
            isVisible: true,
            unAvailable: false,
            identity: [],
            cards: [],
            filteredCard: {},
            deckInfo: {},
            anchorEl: null,
            open: false,
            id: undefined,
            imgSrc: '',
            factions: {},
            decklistNormalRequest: '',
        }
        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.fetchData = this.fetchData.bind(this);
        
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

    filterCards(cardsInfo) {
        let filteredCard = {};
        filteredCard.agenda = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'agenda'
        })
        filteredCard.asset = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'asset'
        })
        filteredCard.operation = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'operation'
        })
        filteredCard.upgrade = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'upgrade'
        })

        filteredCard.barrier = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'ice' 
                && (_.includes(obj.keywords, 'Barrier'))
        })
        filteredCard.codeGate = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'ice' 
                && (_.includes(obj.keywords, 'Code Gate'))
        })
        filteredCard.sentry = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'ice' 
                && (_.includes(obj.keywords, 'Sentry'))
        })
        filteredCard.otherIce = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'ice' 
                && !(
                    _.includes(obj.keywords, 'Barrier') 
                    || _.includes(obj.keywords, 'Code Gate')
                    || _.includes(obj.keywords, 'Sentry')
                )
        })
        filteredCard.ice = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'ice'
        })
        filteredCard.event = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'event'
        })
        filteredCard.hardware = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'hardware'
        })
        filteredCard.resource = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'resource'
        })
        filteredCard.program = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'program'  
                && !(_.includes(obj.keywords, 'Icebreaker') || _.includes(obj.keywords, 'icebreaker'))
        })
        filteredCard.icebreaker = _.filter(cardsInfo, (obj) => {
            return obj.type_code === 'program' 
                && (_.includes(obj.keywords, 'Icebreaker'))
        })
        return filteredCard;
    }

    fetchData(decklist, publishDeckList){
        const the = this;


        var decklistRequest = (publishDeckList 
            ? 'https://netrunnerdb.com/api/2.0/public/decklist/' 
            : 'https://netrunnerdb.com/api/2.0/public/deck/'
        );

        var decklistNormalRequest = (publishDeckList
            ? 'https://netrunnerdb.com/en/decklist/' 
            : 'https://netrunnerdb.com/en/deck/view/'
        );

        const req1 = Axios.get(decklistRequest+decklist)
            .then(  async (response) => {
                // handle success
                let data = response.data.data[0];
                let cards = data.cards;
                let cardsInfo = [];
                for (var cardId in cards) {
                    const card = await Axios.get('https://netrunnerdb.com/api/2.0/public/card/'+cardId).then((response) => {
                        response.data.data[0].numberOfCopies = cards[cardId];
                        return response.data.data[0];
                    })
                    cardsInfo.push(card);
                }
                let index = _.findIndex(cardsInfo, function(obj) {
                    return obj.type_code === 'identity';
                })
                let identity = cardsInfo[index];
                await cardsInfo.splice(index, 1);
                let filteredCard = await the.filterCards(cardsInfo);

                the.setState({ deckInfo: data, identity, cards: cardsInfo, filteredCard})
                return response;
            })
            .catch( (error) => {
                // handle error
                the.setState({unAvailable: true})
            })
        const req2 = Axios.get('https://netrunnerdb.com/api/2.0/public/factions?_locale=en').then(
            (response) => {
                let factions = {};
                for (var i = response.data.data.length - 1; i >= 0; i--) {
                    factions[response.data.data[i].code] = response.data.data[i]
                }

                the.setState({ factions })
            }
        );
        Promise.all([req1, req2]).then(function(values) {
            the.setState(()=>{
                return {finishedLoading:true, decklistNormalRequest}
            })
        });
    }
    componentDidMount(){
        if(this.twitch){
            this.twitch.listen('broadcast', (topic, contentType, message) => {
                try {
                    message = JSON.parse(message);
                    let id = Number(message.decklistId);
                    let publishDeckList =  (message.publishDeckList);
                    if (Number.isFinite(id)) {
                        this.setState(()=>{
                            return {finishedLoading:false}
                        })
                        this.fetchData(id, publishDeckList);
                    } 
                } catch (e) {
                    return ;
                }
            });

            this.twitch.configuration.onChanged( () => {
                try {
                    var obj = JSON.parse(this.twitch.configuration.broadcaster.content);
                    let decklist = Number(obj.decklistId);
                    let publishDeckList =  (obj.publishDeckList);
                    if (Number.isFinite(decklist)){
                        this.fetchData(decklist, publishDeckList);
                    }
                } catch (error) {
                    console.log(error)
                    this.setState({unAvailable: true})
                }
            });

            this.twitch.onAuthorized((auth)=>{
                if(!this.state.finishedLoading){
                    // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.
                   
                    // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
                }
            })

            this.twitch.onVisibilityChanged((isVisible,_c)=>{
                this.visibilityChanged(isVisible)
            })

            this.twitch.onContext((context,delta)=>{
                this.contextUpdate(context,delta)
            })
        }
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

    componentWillUnmount(){
        if(this.twitch){
            this.twitch.unlisten('broadcast', ()=> console.log('successfully unlistened'))
        }
    }

    cardsItem(obj) {
        let src = `https://netrunnerdb.com/card_image/large/${obj.code}.jpg`;
        let imgLink =  `https://netrunnerdb.com/en/card/${obj.code}`;

        return ( 
            <li className="card-item" key={obj.code}>
                <span 
                    className="card"
                    onMouseEnter={(e) => { this.handleClick(e, src ) }}
                    onMouseLeave={this.handleClose}
                >
                    <a className="card-link" href={imgLink} target="_blank" rel="noopener noreferrer">
                         {obj.numberOfCopies}x {obj.title} {this.factionCost(obj)}
                    </a>
                </span>
            </li>
        );
    }


    factionCost( {faction_cost, faction_code, numberOfCopies }){
        let cost = ''
        if (faction_code !== this.state.identity.faction_code){
            for (let i = 0; i < faction_cost*numberOfCopies; i++) {
                cost += '●'
            }
        }
        return (
            <span 
                style={{ 
                    color: `#${this.state.factions[faction_code].color}`,
                    borderColor: `#${this.state.factions[faction_code].color}`,
                }}
            >
                {
                    cost
                }
            </span>
        )
        
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
                {this.cardsInfo(this.state.filteredCard.agenda, 'Agenda')}
                {this.cardsInfo(this.state.filteredCard.asset, 'Asset')}
                {this.cardsInfo(this.state.filteredCard.operation, 'Operation')}
                {this.cardsInfo(this.state.filteredCard.upgrade, 'Upgrade')}
                {this.cardsInfo(this.state.filteredCard.barrier, 'Barrier')}
                {this.cardsInfo(this.state.filteredCard.codeGate, 'Code Gate')}
                {this.cardsInfo(this.state.filteredCard.sentry, 'Sentry')}
                {this.cardsInfo(this.state.filteredCard.otherIce, 'Other Ice')}
                {this.cardsInfo(this.state.filteredCard.event, 'Event')}
                {this.cardsInfo(this.state.filteredCard.hardware, 'Hardware')}
                {this.cardsInfo(this.state.filteredCard.resource, 'Resource')}
                {this.cardsInfo(this.state.filteredCard.icebreaker, 'Icebreaker')}
                {this.cardsInfo(this.state.filteredCard.program, 'Program')}
                <Popover
                    className="popover"
                     anchorOrigin={{
                        vertical: 'center',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'center',
                        horizontal: 'left',
                    }}
                    anchorEl={this.state.anchorEl}
                    open={this.state.open}
                    onClose={this.handleClose}
                >
                  <img src={this.state.imgSrc} width="200" heigth="275" />
                </Popover>
            </div>
        )
    }

    render(){
        if (this.state.unAvailable) {
            return (
                <div className="App">
                    <div className={'App-dark'} >
                        There is no current decklist selected.
                    </div>
                </div>
            );
        }

        if(this.state.finishedLoading){
            if (this.state.cards.length > 0) {
                let deckList =  this.state.decklistNormalRequest+this.state.deckInfo.id;
                let src = `https://netrunnerdb.com/card_image/large/${this.state.identity.code}.jpg`;
                let imgLink = `https://netrunnerdb.com/en/card/${this.state.identity.code}`;
                return (
                    <div className="App">
                        <div className={'App-dark'} >
                            <h1 
                                className="deck-title"
                            > 
                                <a className="card-link" href={deckList} target="_blank" rel="noopener noreferrer">
                                    {this.state.deckInfo.name}
                                </a>
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
                                        color: `#${this.state.factions[this.state.identity.faction_code].color}`,
                                    }}
                                >
                                    {this.state.identity.title} 
                                </a>
                            </h2>
                            {this.renderDeckList()}
                        </div>
                    </div>
                )
            } else {
                return (
                    <div className="App">
                        <div className={'App-dark'} >
                            <div className="lds-ring"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                        </div>
                    </div>
                ) 
            }
        } else {
            return (
                <div className="App">
                    <div className={'App-dark'} >
                        <div className="lds-ring"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                    </div>
                </div>
            ) 
        }

    }
}