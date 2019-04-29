class Player {
	constructor(id, name) {
		this.id = id;
		this.name = name;
		this.wins = 0;
		this.diffLeaderBord = 0;
		this.plays = null;
		this.as = null;
		this.color = null;
	}
	resetPlays() {
		this.plays = new Set();
	}
	addPlay(play) {
		this.plays.add(play.toString());
	}
	hasPlay(play) {
		return this.plays.has(play.toString());
	}
	getId() {
		return this.id;
	}
	setAs(as) {
		this.as = as;
	}
	getAs() {
		return this.as;
	}
	getColor() {
		return this.color;
	}
	setColor(color) {
		this.color = color;
	}
	getName() {
		return this.name;
	}
	setName(name) {
		this.name = name;
	}
	countWin() {
		this.wins++;
		this.diffLeaderBord++;
	}
	getWins() {
		return this.wins;
	}
	getLeaderBoardDiff() {
		return this.diffLeaderBord;
	}
	resetLeaderboard() {
		this.diffLeaderBord = 0;
	}
}

class Game {
	constructor(rootElement) {
		this.rootElement = rootElement;
		// Board
		this.board = null;
		this.size = 3 * 3;
		this.signs = [{ as: 'X', color: '#54741e' }, { as: 'O', color: '#658fdf' }];
		// Game timing
		this.startTime = null;
		this.timeDuration = null;
		this.fastestTime = null;
		this.slowestTime = null;
		// Win combination
		this.winCombination = null;
		this.winCombinations = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],
			[0, 4, 8],
			[6, 4, 2],
		];
		// Players
		//this.playerStartIndex = 0;
		this.playerTurnIndex = 0;
		this.playerUniqueId = 0;
		this.players = [];
		this.currentPlayer = null;

		this.setUIEvents();
	}
	setUIEvents() {
		$('#modalResult').on('click', '.startOverButton', this.start.bind(this));
		$('#startForm').submit(this.startGame.bind(this));
	}
	startGame(e) {
		e.preventDefault();
		var form = $('#startForm');
		var player1 = $('#startForm .player1').val();
		var player2 = $('#startForm .player2').val();
		this.players.push(new Player(this.playerUniqueId++, player1));
		this.players.push(new Player(this.playerUniqueId++, player2));
		form.hide();
		this.start();
	}
	start() {
		this.resetGame();
		this.setupPlayers();
		this.updateStatistics();
	}
	resetGame() {
		this.winCombination = null;
		this.startTime = null;
		this.hideResults();
		this.drawBoard();
	}
	drawBoard() {
		this.board = Array.from(Array(this.size).keys());
		this.resetCells();
		this.setCellListeners();
	}
	resetCells() {
		$(this.rootElement + ' td').each(function() {
			$(this).text('');
			$(this).css('background', 'none');
		});
	}
	setCellListeners() {
		this.removeCellListners();
		$(this.rootElement).on('click', 'td', this.turnClick.bind(this));
	}
	removeCellListners() {
		$(this.rootElement).off('click');
	}
	setupPlayers() {
		// alternate who start the game
		//this.playerTurnIndex = this.playerStartIndex++;
		//this.setCurrentPlayer((this.playerTurnIndex) % 2);
		// always player 1 starts;
		this.playerTurnIndex = 0;
		this.setCurrentPlayer(0);
		// Set both player with O and reset plays
		this.players.forEach(p => {
			p.resetPlays();
			p.setAs(this.signs[1].as);
			p.setColor(this.signs[1].color);
		});
		// Set first and current player as X
		this.currentPlayer.setAs(this.signs[0].as);
		this.currentPlayer.setColor(this.signs[0].color);
		this.updateWhoseTurn();
	}
	setCurrentPlayer(index) {
		this.currentPlayer = this.players[index];
	}
	turnClick(e) {
		var elem = $(e.target)[0];
		// Check if there is a number in the board position
		if (typeof this.board[elem.id] === 'number') {
			this.turn(elem.id);
		}
	}
	turn(cellId) {
		let asSign = this.currentPlayer.getAs();
		// In case first X set startTime
		if (!this.startTime) this.startTime = new Date();
		// update user with new play;
		this.currentPlayer.addPlay(cellId);
		// update board with current player sign
		this.setCell(cellId, asSign);
		// Check if the game is over
		if (this.hasWin() || this.hasTie()) {
			this.setTimeDuration();
			this.gameOver();
		} else {
			// Update the currentPlayer.
			this.alternateTurn();
			// Update text on page.
			this.updateWhoseTurn();
		}
	}
	setCell(cellId, asSign) {
		this.board[cellId] = asSign;
		$(this.rootElement + ' #' + cellId).text(asSign);
		$(this.rootElement + ' #' + cellId).css(
			'color',
			this.currentPlayer.getColor()
		);
	}
	// Increment the turn index and set currentPlayer;
	alternateTurn() {
		this.setCurrentPlayer((this.playerTurnIndex + 1) % 2);
		this.playerTurnIndex++;
	}
	updateWhoseTurn() {
		$('.whoseTurn').text(`${this.currentPlayer.getAs()} player turn`);
		$('.whoseTurn').css('color', this.currentPlayer.getColor());
	}
	// Loop win combinations and compare against current player plays
	hasWin() {
		var result = false;
		for (var i = 0; i < this.winCombinations.length; i++) {
			let win = this.winCombinations[i];
			if (win.every(position => this.currentPlayer.hasPlay(position))) {
				this.winCombination = win;
				result = true;
				break;
			}
		}
		return result;
	}
	// Check if there are numbers in the board not pickup yet.
	hasTie() {
		return !this.board.some(position => typeof position === 'number');
	}
	// Set time duration and update fastest and slowest
	setTimeDuration() {
		var diff = new Date() - this.startTime;
		this.timeDuration = Math.abs(diff / 1000).toFixed(1);
		this.fastestTime = this.fastestTime
			? Math.min(this.fastestTime, this.timeDuration)
			: this.timeDuration;
		this.slowestTime = this.slowestTime
			? Math.max(this.slowestTime, this.timeDuration)
			: this.timeDuration;
	}
	gameOver() {
		var msg = null;
		if (this.winCombination) {
			this.displayWinCombination();
			this.setWinnerPlayerResults();
		} else {
			msg = 'Tie Game!';
			this.showResult(msg);
		}
		this.updateLeaderBoard();
		this.removeCellListners();
	}
	setWinnerPlayerResults() {
		this.currentPlayer.countWin();
		var msg = `${this.currentPlayer.getAs()} player won in ${
			this.timeDuration
		}s!`;
		this.showResult(msg);
	}
	displayWinCombination() {
		this.winCombination.forEach(position =>
			$(this.rootElement + ' #' + position).css('background', '#41f16a')
		);
	}
	showResult(msg) {
		$('#modalResult .message').css('color', this.currentPlayer.getColor());
		$('#modalResult .message').text(msg);
		$('#modalResult').css('display', 'flex');
	}
	hideResults() {
		$('#modalResult').hide();
	}
	updateStatistics() {
		let playersEl = $('#statistics .players');
		playersEl.empty();

		this.players.forEach((player, i) => {
			let playerEl = `<div class="player">${i}. ${player.getName()} (${player.getAs()}) ${player.getWins()} games won</div>`;
			playersEl.append(playerEl);
		});

		if (this.fastestTime) {
			let gameEl = $('#statistics .game');
			gameEl.text(
				`Fastest Time: ${this.fastestTime}s Slowest Time: ${this.slowestTime}s`
			);
		}
		this.displayLeaderBoard();

		$('#statistics').show();
	}
	getLeaderBoard() {
		var storedPlayers = localStorage.getItem('leaderBoard');
		return storedPlayers ? new Map(JSON.parse(storedPlayers)) : new Map();
	}
	updateLeaderBoard() {
		var leaderBoard = this.getLeaderBoard();
		this.players.forEach(player => {
			var playerName = player.getName();
			if (leaderBoard.has(playerName)) {
				leaderBoard.set(
					playerName,
					leaderBoard.get(playerName) + player.getLeaderBoardDiff()
				);
			} else {
				leaderBoard.set(playerName, player.getLeaderBoardDiff());
			}
			player.resetLeaderboard();
		});

		var leaderBoardSorted = [...leaderBoard.entries()].sort(
			(a, b) => b[1] - a[1]
		);
		var top10 = leaderBoardSorted.splice(
			0,
			leaderBoardSorted.length >= 10 ? 10 : leaderBoardSorted.length
		);
		localStorage.setItem('leaderBoard', JSON.stringify(top10));
	}
	displayLeaderBoard() {
		let leaderBoardEl = $('#statistics .leaderBoard');
		leaderBoardEl.empty();
		[...this.getLeaderBoard()].forEach((player, i) => {
			let playerEl = `<div class="player">${i + 1}. ${player[0]}: ${
				player[1]
			} games won</div>`;
			leaderBoardEl.append(playerEl);
		});
	}
}

var game = new Game('#board');
