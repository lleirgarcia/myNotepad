import UIKit
import Capacitor

/// Custom bridge view controller to prevent refresh when user scrolls to the top on iPhone.
/// Disables scroll bounce and ensures no pull-to-refresh control can trigger a reload.
class MyBridgeViewController: CAPBridgeViewController {

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        guard let webView = webView else { return }
        let scrollView = webView.scrollView
        scrollView.bounces = false
        scrollView.alwaysBounceVertical = false
        scrollView.alwaysBounceHorizontal = false
        scrollView.refreshControl = nil
    }
}
