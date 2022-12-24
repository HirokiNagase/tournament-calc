<template>
  <div>
      <button
          size="small"
          @click="calclate"
        >
          calclate
        </button>
    <div>
      {{ nowTrial }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  data() {
    return {
      playerNum: 256,
      round: 10,
      trials: 10,
      nowTrial: 0,
      deckList: [
        {
          deckId: 1,
          deckName: 'rakdos-mid',
          share: 45,
          winRate: [
            50,
            48,
            55
          ]
        },
        {
          deckId: 2,
          deckName: 'mono-G',
          share: 40,
          winRate: [
            52,
            50,
            48
          ]
        },
        {
          deckId: 3,
          deckName: 'others',
          share: 15,
          winRate: [
            45,
            52,
            50
          ]
        }
      ],
      myDeckRate: [55, 52, 40],
      players: [],
      results:[]
    }
  },
  methods: {
    createPlayerDeck(){
      // Deckの占有率とプレイヤー数から各デッキに何名使用者がいるかのデータ作成
      const you = {
        id: 0,
        deckId: 0,
        deckName: 'yourDeck',
        winRate: this.myDeckRate,
        point: 0,
        matchLog: [],
        opp: 0,
        mwp: 0,
        matched: false
      }
      this.players.push(you)
      const sortedDecks = this.deckList.sort((a,b) => a.share - b.share)
      for (let i = 1; i <= this.playerNum - 1; i++) {
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
              matched: false
            }
            this.players.push(player)
            break
          }
        }
      }
    },
    calclate() {
      for (let i = 0; i < this.trials; i++) {
        this.nowTrial = i + 1
        console.log(this.nowTrial)
        // 1回の大会
        this.createPlayerDeck()
        for (let round = 1; round <= this.round; round++) {
          // 各ラウンド
          const pairing = this.makeMatch()
          // 勝敗処理
          this.game(pairing)

          // 全マッチ終了
          // Drop処理作るならここに
        }
        // 全ラウンド終了
        // Opp計算
        this.calcOpp()

        // 結果保存
        // 1~8のデッキタイプ, 各デッキの8進出率算出
        this.result()
      }
      console.log(this.results)
      const myDeck8 = this.results.filter(result => result.myDeckIn8 === true)
      console.log('top8率')
      console.log(myDeck8.length / this.trials)

    },
    makeMatch() {
      const pairing = []
      // ポイントが高いプレイヤーからマッチングを作成
      const sortedPlayers = this.players.sort((a,b) => b.opp - a.opp).sort((a,b) => b.point - a.point)
      sortedPlayers.forEach(player => {
        // 多分sortedPlayersにmatchedの情報が更新して入らないはずなのでfindしておく不明
        const myId = player.id
        const matched = this.players.find(x => x.id === myId)
        if (!matched.matched) {
          // 未マッチングのプレイヤーの中で同数のポイントを確認
          let myPoint = player.point
          let matchingFlag = false
          while (matchingFlag === false) {
            if (myPoint < 0) {
              // 奇数の場合これが起こるはずで、その時はBye処理をして終了
              pairing.push([player, 'bye'])
              break
            }
            // 候補プレイヤー一覧
            const candidatePlayers = this.players.filter(candidate => {
              return candidate.id !== myId
                  && candidate.point === myPoint
                  && candidate.matched === false
                  && this.logCheck(player, candidate)
            })
            // 候補0人だったらPOINTを3つ下げるよ
            // 引き分けない前提だから処理速度の都合でこうだけどある時は違う処理にしようね
            if (!candidatePlayers.length) {
              matchingFlag = false
              myPoint = myPoint - 3
            } else {
              matchingFlag = true
              // candidatePlayers 配列の中からランダムに1つ選択(それがplayerの対戦相手)
              const opponent = candidatePlayers[Math.floor(Math.random() * candidatePlayers.length)]
              const opponentId = opponent.id

              pairing.push([player, opponent])
              this.players.map(x => {
                if (x.id === opponentId || x.id === myId) {
                  x.matched = true
                }
                return x
              })

            }
          }
        }


      })
      // マッチング終わったからmatchedフラグリセットしておく
      this.players.map(player => {
        player.matched = false
        return player
      })
      return pairing
    },
    logCheck(player1, player2) {
      const player1Log = player1.matchLog
      const player2Id = player2.id
      // 既に対戦済みならfalse,未対戦ならtrueを返す
      return !player1Log.includes(player2Id)
    },
    game(pairing) {
      pairing.forEach(([player1, player2]) => {
        // まずマッチングログの追加
        // byeの時の処理
        if (player2 === 'bye') {
          this.players.map(x => {
            if (x.id === player1.id) {
              // player.matchLog.push('bye')
              x.point = x.point + 3
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
                for(let i = 0; i < arr.length; i++) {
                    if(arr[i][prop] === value) {
                        return i;
                    }
                }
                return -1;
            }

            const myIndex = getIndex(0, playerArray,'deckId') // 0,1
            const otherIndex = myIndex === 0 ? 1 : 0

            const myWinrate = playerArray[myIndex].winRate[playerArray[otherIndex].deckId - 1]
            const rand = Math.floor(Math.random() * 100)
            const myDeckWin = rand <= myWinrate // Boolean
            if (myDeckWin) {
              this.win(playerArray[myIndex], playerArray[otherIndex])
            } else {
              this.win(playerArray[otherIndex], playerArray[myIndex])
            }
          } else {
            // 両者既存のデッキの処理
            const deck1Winrate =  player1.winRate[player2.deckId - 1]
            const rand = Math.floor(Math.random() * 100)
            const player1Win = rand <= deck1Winrate // Boolean
            if (player1Win) {
              this.win(player1, player2)
            } else {
              this.win(player2, player1)
            }
          }
        }
      })
    },
    win(winPlayer, losePlayer) {
      this.players.map(x => {
            if (x.id === winPlayer.id) {
              x.matchLog.push(losePlayer.id)
              x.point = x.point + 3
            } else if (x.id === losePlayer.id) {
              x.matchLog.push(winPlayer.id)
            }
            return x
          })
    },
    calcOpp() {
      // まず全playerのmwpを出してやる
      this.players.map(player => {
        const mwp = player.point / (this.round * 3)
        player.mwp = mwp > 0.33 ? mwp : 0.33
        return player
      })
      // 全playerのopp%を出す
      this.players.map(player => {
        let sumMwp = 0
        player.matchLog.forEach(opponentId => {
          const opponent = this.players.find(x => x.id === opponentId)
          sumMwp += opponent.mwp
        })
        // byeの分はoppは無視？で合ってる？
        player.opp = sumMwp / player.matchLog.length
        return player
      })
    },
    result() {
      const sortedPlayers = this.players.sort((a,b) => b.opp - a.opp).sort((a,b) => b.point - a.point)
      const top8Players = sortedPlayers.slice(0,8)

      const top8Rate = this.deckList.map(deck => {
        const id = deck.deckId
        const deckPlayer = this.players.filter(player => player.deckId === id)
        const top8Deck = top8Players.filter(player => player.deckId === id)
        return {
          deckId: deck.deckId,
          rate: top8Deck.length / deckPlayer.length
        }
      })
      const top8DeckType = top8Players.map(player => {
        return player.deckId
      })
      const myDeckIn8 = top8DeckType.includes(0)

      const result = {
        top8Deck: top8DeckType,
        top8Rate,
        myDeckIn8
      }
      console.log(result)
      this.results.push(result)
    }
  }
}
</script>
