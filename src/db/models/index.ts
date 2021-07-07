import Account from './account'
import Balance from './balance'
import Block from './block'
import Channel from './channel'
import Council from './council'
import Consul from './councilseat'
import ConsulStake from './councilstake'
import Era from './era'
import Event from './event'
import Proposal from './proposal'
import ProposalPost from './proposalpost'
import ProposalVote from './proposalvote'
import Member from './member'
import Category from './category'
import Thread from './thread'
import Post from './post'
import Moderation from './moderation'
import ValidatorStats from './validatorstats'
import StartBlock from './startblock'


Member.hasMany(Account)
Member.belongsTo(Account, { as: 'root', constraints: false })
Member.belongsTo(Account, { as: 'controller', constraints: false })
Member.hasMany(Consul, { as: 'terms' })
Member.hasMany(ConsulStake, { as: 'votes' })
Member.hasMany(Category)
Member.hasMany(Thread)
Member.hasMany(Post)
Member.hasMany(Proposal)

Account.belongsTo(Member)
Account.hasMany(Balance)
//Account.hasMany(Block, { as: 'validated', foreignKey: 'validatorKey' })
Account.hasMany(Moderation)

Balance.belongsTo(Account)
Balance.belongsTo(Era)

Era.hasMany(Balance)
Era.hasMany(Block)

Block.belongsTo(Account, { as: 'validator' })
Block.belongsTo(Era)
Block.hasMany(Event)
Event.belongsTo(Block)

Council.hasMany(Consul)
Council.hasMany(Proposal)
Consul.belongsTo(Council)
Consul.belongsTo(Member)
Consul.hasMany(ConsulStake, { as: 'voters' })
Consul.hasMany(ProposalVote, { as: 'votes' })
ConsulStake.belongsTo(Consul)
ConsulStake.belongsTo(Member)

Channel.belongsTo(Member, { as: 'owner' })

Category.hasMany(Thread)

Category.belongsTo(Moderation)
Thread.belongsTo(Moderation)
Post.belongsTo(Moderation)
Moderation.hasMany(Category)
Moderation.hasMany(Thread)
Moderation.hasMany(Post)
Moderation.belongsTo(Account, { as: 'moderator' })

Thread.belongsTo(Category)
Thread.belongsTo(Member, { as: 'creator' })
Thread.hasMany(Post)

Post.belongsTo(Thread)
Post.belongsTo(Member, { as: 'author' })
Post.belongsTo(Member, { as: 'moderator' })

Proposal.belongsTo(Member, { as: 'author' })
Proposal.hasMany(ProposalPost, { as: 'posts' })
Proposal.hasMany(ProposalVote, { as: 'votes' })

ProposalPost.belongsTo(Proposal)
ProposalPost.belongsTo(Member, { as: 'author' })

ProposalVote.belongsTo(Proposal)
ProposalVote.belongsTo(Consul)
ProposalVote.belongsTo(Member)

ValidatorStats.belongsTo(Era)
ValidatorStats.belongsTo(Account)

export {
  Account,
  Balance,
  Block,
  Channel,
  Council,
  Consul,
  ConsulStake,
  Era,
  Event,
  Member,
  Proposal,
  ProposalPost,
  ProposalVote,
  Category,
  Thread,
  Post,
  Moderation,
  ValidatorStats,
  StartBlock
}
