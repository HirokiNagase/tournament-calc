<template>
  <el-drawer
    class="drawer"
    :title="selectDeck.deckName"
    :visible.sync="drawerVisible"
    direction="rtl"
    @close="closeEdit"
  >
    <el-input v-model="selectDeck.deckName" placeholder="デッキ名"></el-input>
    <span>メタゲーム占有率</span>
    <el-slider v-model="selectDeck.share" show-input></el-slider>
    <div v-for="(rate, index) in selectDeck.winRate" :key="index" class="block">
      <span>対{{ deckList[index].deckName }}の勝率</span>
      <el-slider
        v-model="selectDeck.winRate[index]"
        :value="rate"
        :disabled="deckList[index].deckId === selectDeck.deckId"
        show-input
        @input="changeRate(selectDeck.deckId, index)"
      ></el-slider>
    </div>
  </el-drawer>
</template>

<script>
export default {
  props: {
    selectDeck: Object,
    drawerVisible: Boolean,
    deckList: Array,
  },
  methods: {
    closeEdit() {
      this.$emit('update:drawerVisible', false)
    },
    changeRate(selectDeckId, oppIndex) {
      this.$emit('change-rate', { selectDeckId, oppIndex })
    },
  },
}
</script>
