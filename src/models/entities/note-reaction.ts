import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { Note } from './note';
import { id } from '../id';

@Entity()
@Index(['userId', 'noteId'], { unique: false })
@Index(['userId', 'noteId', 'reaction'], { unique: true })
export class NoteReaction {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the NoteReaction.'
	})
	public createdAt: Date;

	@Index()
	@Column(id())
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user?: User | null;

	@Index()
	@Column(id())
	public noteId: Note['id'];

	@ManyToOne(type => Note, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public note?: Note | null;

	// TODO: 対象noteのuserIdを非正規化したい(「受け取ったリアクション一覧」のようなものを(JOIN無しで)実装したいため)

	@Column('varchar', {
		length: 260
	})
	public reaction: string;
}
