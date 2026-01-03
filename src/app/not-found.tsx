import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.notFoundContainer}>
      <div className={styles.notFoundContent}>
        <div className={styles.notFoundIcon}>🔍</div>
        <h1 className={styles.notFoundTitle}>404</h1>
        <h2 className={styles.notFoundSubtitle}>ページが見つかりません</h2>
        <p className={styles.notFoundMessage}>
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link href="/" className={styles.homeLink}>
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
