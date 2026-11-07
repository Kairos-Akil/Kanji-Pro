import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KanjiLayout = () => (
    <TopSlider
        tabs={[
            buildTab('kanjiN3Tier1', 'kanji_n3_tier1'),
            buildTab('kanjiN3Tier2', 'kanji_n3_tier2'),
            buildTab('kanjiN3Tier3', 'kanji_n3_tier3'),
        ]}
    />
)

export default KanjiLayout
