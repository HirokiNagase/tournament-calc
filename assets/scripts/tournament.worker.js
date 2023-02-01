self.addEventListener('message', (message) => {
  const tournamentResults = []
  const { deckList, myDeckRate, playerNum, range, round, useMyDeck } =
    message.data
  for (let i = 0; i < range; i++) {
    // 1回の大会
    let players = createPlayerDeck(deckList, myDeckRate, playerNum, useMyDeck)
    for (let nowRound = 0; nowRound < round; nowRound++) {
      // 各ラウンド
      if (nowRound !== 0) {
        players = players.map((player) => {
          player.matched = false
          return player
        })
      }
      const pairing = makeMatch(players)

      // 勝敗処理
      players = game(pairing, players)

      // 全マッチ終了
      // Drop処理作るならここに
    }
    // 全ラウンド終了
    // Opp計算
    players = calcOpp(players, round)
    // 結果保存
    // 1~8のデッキタイプ, 各デッキの8進出率算出
    const tournamentResult = result(players, deckList)
    tournamentResults.push(tournamentResult)
  }
  self.postMessage(tournamentResults)
})

function createPlayerDeck(deckList, myDeckRate, playerNum, useMyDeck) {
  const players = []
  // Deckの占有率とプレイヤー数から各デッキに何名使用者がいるかのデータ作成
  const you = {
    id: 0,
    deckId: 0,
    deckName: 'myDeck',
    winRate: myDeckRate,
    point: 0,
    matchLog: [],
    opp: 0,
    mwp: 0,
    matched: false,
  }
  if (useMyDeck) {
    players.push(you)
  }
  const sortedDecks = deckList
    .filter(({ share }) => share > 0)
    .sort((a, b) => a.share - b.share)
  for (let i = useMyDeck ? 1 : 0; i <= playerNum - 1; i++) {
    const rand = Math.floor(Math.random() * 100)
    let counter = 0
    for (const deck of sortedDecks) {
      counter += deck.share
      if (counter >= rand) {
        const player = {
          ...deck,
          id: i,
          point: 0,
          matchLog: [],
          opp: 0,
          mwp: 0,
          matched: false,
        }
        players.push(player)
        break
      }
    }
  }
  return players
}

function makeMatch(players) {
  const pairing = []
  // ポイントが高いプレイヤーからマッチングを作成
  const sortedPlayers = players
    .sort((a, b) => b.opp - a.opp)
    .sort((a, b) => b.point - a.point)
  let matchedPlayers = sortedPlayers
  sortedPlayers.forEach((player) => {
    const myId = player.id
    const matched = matchedPlayers.find((x) => x.id === myId)
    if (!matched.matched) {
      // 未マッチングのプレイヤーの中で同数のポイントを確認
      let myPoint = player.point
      let matchingFlag = false
      while (matchingFlag === false) {
        if (myPoint < 0) {
          // 奇数の場合これがこれが最後に起こるはずで、その時はBye処理をして終了
          pairing.push([player, 'bye'])
          break
        }
        // 候補プレイヤー一覧
        const candidatePlayers = matchedPlayers.filter((candidate) => {
          return (
            candidate.id !== myId &&
            candidate.point === myPoint &&
            candidate.matched === false &&
            logCheck(player, candidate)
          )
        })
        // 候補0人だったらPOINTを3つ下げるよ
        // 引き分けない前提だから処理速度の都合でこうだけどある時は違う処理にしようね
        if (!candidatePlayers.length) {
          matchingFlag = false
          myPoint -= 3
        } else {
          matchingFlag = true
          // candidatePlayers 配列の中からランダムに1つ選択(それがplayerの対戦相手)
          const opponent =
            candidatePlayers[
              Math.floor(Math.random() * candidatePlayers.length)
            ]
          const opponentId = opponent.id

          pairing.push([player, opponent])
          matchedPlayers = matchedPlayers.map((x) => {
            if (x.id === opponentId || x.id === myId) {
              x.matched = true
            }
            return x
          })
        }
      }
    }
  })
  return pairing
}

function logCheck(player1, player2) {
  const player1Log = player1.matchLog
  const player2Id = player2.id
  // 既に対戦済みならfalse,未対戦ならtrueを返す
  return !player1Log.includes(player2Id)
}

function game(pairing, players) {
  let recentPlayers = players
  pairing.forEach(([player1, player2]) => {
    // まずマッチングログの追加
    // byeの時の処理
    if (player2 === 'bye') {
      recentPlayers = recentPlayers.map((x) => {
        if (x.id === player1.id) {
          x.point += 3
        }
        return x
      })
    } else {
      // どちらのデッキも自身のデッキでないことの確認(自身のデッキは勝率固有なので)
      const myDeckFlag = player1.deckId === 0 || player2.deckId === 0
      if (myDeckFlag) {
        // どちらかが自身の場合の処理
        const playerArray = [player1, player2]

        const getIndex = (value, arr, prop) => {
          for (let i = 0; i < arr.length; i++) {
            if (arr[i][prop] === value) {
              return i
            }
          }
          return -1
        }

        const myIndex = getIndex(0, playerArray, 'deckId') // 0,1
        const otherIndex = myIndex === 0 ? 1 : 0

        const myWinrate =
          playerArray[myIndex].winRate[playerArray[otherIndex].deckId - 1]
        const rand = Math.floor(Math.random() * 100)
        const myDeckWin = rand <= myWinrate // Boolean
        if (myDeckWin) {
          recentPlayers = win(
            playerArray[myIndex],
            playerArray[otherIndex],
            recentPlayers
          )
        } else {
          recentPlayers = win(
            playerArray[otherIndex],
            playerArray[myIndex],
            recentPlayers
          )
        }
      } else {
        // 両者既存のデッキの処理
        const deck1Winrate = player1.winRate[player2.deckId - 1]
        const rand = Math.floor(Math.random() * 100)
        const player1Win = rand <= deck1Winrate // Boolean
        if (player1Win) {
          recentPlayers = win(player1, player2, recentPlayers)
        } else {
          recentPlayers = win(player2, player1, recentPlayers)
        }
      }
    }
  })
  return recentPlayers
}

function win(winPlayer, losePlayer, players) {
  return players.map((x) => {
    if (x.id === winPlayer.id) {
      x.matchLog.push(losePlayer.id)
      x.point += 3
    } else if (x.id === losePlayer.id) {
      x.matchLog.push(winPlayer.id)
    }
    return x
  })
}

function calcOpp(players, round) {
  // まず全playerのmwpを出してやる
  const addMwp = players.map((player) => {
    const mwp = player.point / (round * 3)
    player.mwp = mwp > 0.33 ? mwp : 0.33
    return player
  })
  const addOpp = addMwp.map((player) => {
    // 全playerのopp%を出す
    let sumMwp = 0
    player.matchLog.forEach((opponentId) => {
      const opponent = addMwp.find((x) => x.id === opponentId)
      sumMwp += opponent.mwp
    })
    // byeの分はoppは無視？で合ってる？
    player.opp = sumMwp / player.matchLog.length
    return player
  })
  return addOpp
}

function arrayShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // 0〜(i+1)の範囲で値を取得
    const r = Math.floor(Math.random() * (i + 1))
    const tmp = array[i]
    array[i] = array[r]
    array[r] = tmp
  }
  return array
}

function result(players, deckList) {
  const randomPlauers = arrayShuffle(players)
  const sortedPlayers = randomPlauers
    .sort((a, b) => b.opp - a.opp)
    .sort((a, b) => b.point - a.point)
  const top8Players = sortedPlayers.slice(0, 8)

  const top8Rate = deckList.map((deck) => {
    const id = deck.deckId
    const deckPlayer = players.filter((player) => player.deckId === id)
    const top8Deck = top8Players.filter((player) => player.deckId === id)
    return {
      deckId: deck.deckId,
      rate: top8Deck.length / deckPlayer.length || 0,
    }
  })
  const top8DeckType = top8Players.map((player) => {
    return player.deckId
  })
  const myDeckIn8 = top8DeckType.includes(0)

  const result = {
    top8Deck: top8DeckType,
    top8Rate,
    myDeckIn8,
  }
  return result
}
