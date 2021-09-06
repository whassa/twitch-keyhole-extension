export function filterNetrunnerDBCards(cardsInfo) {
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

export function filterJintekiCards(cardsInfo) {
    let filteredCard = {};
    filteredCard.agenda = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Agenda'
    })
    filteredCard.asset = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Asset'
    })
    filteredCard.operation = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Operation'
    })
    filteredCard.upgrade = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Upgrade'
    })

    filteredCard.barrier = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Ice' 
            && (_.includes(obj.details.subtype, 'Barrier'))
    })
    filteredCard.codeGate = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Ice' 
            && (_.includes(obj.details.subtype, 'Code Gate'))
    })
    filteredCard.sentry = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Ice' 
            && (_.includes(obj.details.subtype, 'Sentry'))
    })
    filteredCard.otherIce = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Ice' 
            && !(
                _.includes(obj.details.subtype, 'Barrier') 
                || _.includes(obj.details.subtype, 'Code Gate')
                || _.includes(obj.details.subtype, 'Sentry')
            )
    })
    filteredCard.ice = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Ice'
    })
    filteredCard.event = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Event'
    })
    filteredCard.hardware = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Hardware'
    })
    filteredCard.resource = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Resource'
    })
    filteredCard.program = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Program'  
            && !(_.includes(obj.details.subtype, 'Icebreaker') || _.includes(obj.details.subtype, 'icebreaker'))
    })
    filteredCard.icebreaker = _.filter(cardsInfo, (obj) => {
        return obj.details.type === 'Program' 
            && (_.includes(obj.details.subtype, 'Icebreaker'))
    })
    return filteredCard;
}